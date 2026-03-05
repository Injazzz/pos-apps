<?php

namespace App\Services;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PaymentService
{
    public function __construct(
        private readonly MidtransService $midtransService
    ) {}

    // =========================================================
    // PROCESS PAYMENT (Cash / Transfer / QRIS / DP)
    // =========================================================

    public function processPayment(
        Order $order,
        array $data,
        User  $actor
    ): Payment {
        return DB::transaction(function () use ($order, $data, $actor) {

            $method = PaymentMethod::from($data['method']);

            // Cek apakah sudah ada payment pending/paid
            $existing = $order->payment;
            if ($existing && in_array($existing->status->value ?? $existing->status, [
                PaymentStatus::PAID->value,
            ])) {
                throw ValidationException::withMessages([
                    'payment' => ['Order ini sudah lunas.'],
                ]);
            }

            $paymentData = [
                'order_id'     => $order->id,
                'method'       => $method->value,
                'amount'       => $order->total_price,
                'processed_by' => $actor->id,
            ];

            // Method-specific logic
            switch ($method->value) {

                case PaymentMethod::CASH->value:
                    $cashReceived = $data['cash_received'];
                    if ($cashReceived < $order->total_price) {
                        throw ValidationException::withMessages([
                            'cash_received' => ['Uang yang diterima kurang dari total tagihan.'],
                        ]);
                    }
                    $paymentData += [
                        'status'        => PaymentStatus::PAID->value,
                        'cash_received' => $cashReceived,
                        'change_amount' => $cashReceived - $order->total_price,
                        'paid_amount'   => $order->total_price,
                        'paid_at'       => now(),
                    ];
                    break;

                case PaymentMethod::TRANSFER_BANK->value:
                    $paymentData += [
                        'status'    => PaymentStatus::PENDING->value,
                        'bank_name' => $data['bank_name'] ?? null,
                    ];
                    break;

                case PaymentMethod::QRIS->value:
                    $paymentData += [
                        'status' => PaymentStatus::PENDING->value,
                    ];
                    break;

                case PaymentMethod::DOWN_PAYMENT->value:
                    $dpAmount = $data['dp_amount'];
                    if ($dpAmount >= $order->total_price) {
                        throw ValidationException::withMessages([
                            'dp_amount' => ['DP tidak boleh melebihi total tagihan. Gunakan metode bayar penuh.'],
                        ]);
                    }
                    $paymentData += [
                        'status'           => PaymentStatus::PARTIAL->value,
                        'dp_amount'        => $dpAmount,
                        'paid_amount'      => $dpAmount,
                        'remaining_amount' => $order->total_price - $dpAmount,
                        'paid_at'          => now(),
                    ];
                    break;

                case PaymentMethod::MIDTRANS->value:
                    // Midtrans di-handle via createMidtransSnap()
                    throw ValidationException::withMessages([
                        'method' => ['Gunakan endpoint /payment/snap untuk pembayaran via Midtrans.'],
                    ]);
            }

            // Hapus payment lama jika ada (pending)
            if ($existing && ($existing->status->value ?? $existing->status) === PaymentStatus::PENDING->value) {
                $existing->delete();
            }

            return Payment::create($paymentData);
        });
    }

    // =========================================================
    // MIDTRANS SNAP TOKEN
    // =========================================================

    public function createMidtransSnap(Order $order, User $actor): Payment
    {
        return DB::transaction(function () use ($order, $actor) {

            // Cek existing payment
            if ($order->payment?->status?->value === PaymentStatus::PAID->value) {
                throw ValidationException::withMessages([
                    'payment' => ['Order ini sudah lunas.'],
                ]);
            }

            // Generate Midtrans token
            $snapData = $this->midtransService->createSnapToken($order);

            // Update atau buat payment record
            $payment = Payment::updateOrCreate(
                ['order_id' => $order->id],
                [
                    'method'              => PaymentMethod::MIDTRANS->value,
                    'status'              => PaymentStatus::PENDING->value,
                    'amount'              => $order->total_price,
                    'midtrans_order_id'   => 'POS-' . $order->order_code,
                    'midtrans_token'      => $snapData['token'],
                    'midtrans_url'        => $snapData['redirect_url'],
                    'expired_at'          => now()->addHours(24),
                    'processed_by'        => $actor->id,
                ]
            );

            return $payment;
        });
    }

    // =========================================================
    // HANDLE MIDTRANS WEBHOOK
    // =========================================================

    public function handleMidtransWebhook(array $payload): void
    {
        // Verifikasi signature
        $this->midtransService->verifyWebhookSignature($payload);

        $midtransOrderId = $payload['order_id'];
        $transactionStatus = $payload['transaction_status'];
        $fraudStatus = $payload['fraud_status'] ?? null;

        $payment = Payment::where('midtrans_order_id', $midtransOrderId)->first();

        if (!$payment) return;

        $newStatus = $this->mapMidtransStatus(
            $transactionStatus,
            $fraudStatus
        );

        $updateData = [
            'status'                   => $newStatus,
            'midtrans_transaction_id'  => $payload['transaction_id'] ?? null,
            'midtrans_payment_type'    => $payload['payment_type'] ?? null,
            'midtrans_response'        => $payload,
        ];

        if ($newStatus === PaymentStatus::PAID->value) {
            $updateData['paid_at']     = now();
            $updateData['paid_amount'] = $payment->amount;
        }

        $payment->update($updateData);
    }

    // =========================================================
    // CONFIRM TRANSFER PAYMENT (manual confirm by kasir)
    // =========================================================

    public function confirmTransferPayment(
        Payment $payment,
        ?string $proofPath = null
    ): Payment {
        if ($payment->status->value !== PaymentStatus::PENDING->value) {
            throw ValidationException::withMessages([
                'payment' => ['Payment ini sudah diproses.'],
            ]);
        }

        $updateData = [
            'status'     => PaymentStatus::PAID->value,
            'paid_at'    => now(),
            'paid_amount'=> $payment->amount,
        ];

        if ($proofPath) {
            $updateData['transfer_proof'] = $proofPath;
        }

        $payment->update($updateData);

        return $payment->fresh();
    }

    // =========================================================
    // PRIVATE HELPERS
    // =========================================================

    private function mapMidtransStatus(
        string  $transactionStatus,
        ?string $fraudStatus
    ): string {
        return match (true) {
            $transactionStatus === 'capture' && $fraudStatus === 'accept',
            $transactionStatus === 'settlement' => PaymentStatus::PAID->value,

            $transactionStatus === 'pending'     => PaymentStatus::PENDING->value,

            in_array($transactionStatus, ['cancel', 'deny', 'expire'])
                                                  => PaymentStatus::EXPIRED->value,

            $transactionStatus === 'refund'       => PaymentStatus::REFUNDED->value,

            default                               => PaymentStatus::FAILED->value,
        };
    }
}
