<?php

namespace App\Http\Controllers\Api\Cashier;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Payment\CreatePaymentRequest;
use App\Http\Resources\PaymentResource;
use App\Models\Order;
use App\Models\Payment;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class PaymentController extends BaseApiController
{
    use AuthorizesRequests;

    public function __construct(
        private readonly PaymentService $paymentService
    ) {}

    public function show(Order $order): JsonResponse
    {
        $payment = $order->payment;

        if (!$payment) {
            return $this->notFoundResponse('Belum ada data pembayaran.');
        }

        return $this->successResponse(
            new PaymentResource($payment),
            'Data pembayaran berhasil diambil.'
        );
    }

    public function store(
        CreatePaymentRequest $request,
        Order $order
    ): JsonResponse {
        $this->authorize('create', [Payment::class, $order]);

        $payment = $this->paymentService->processPayment(
            $order,
            $request->validated(),
            $request->user()
        );

        return $this->createdResponse(
            new PaymentResource($payment),
            'Pembayaran berhasil diproses.'
        );
    }

    public function confirmTransfer(
        Request $request,
        Order $order
    ): JsonResponse {
        $this->authorize('processCash', Payment::class);

        $payment = $order->payment;
        if (!$payment) {
            return $this->notFoundResponse('Data pembayaran tidak ditemukan.');
        }

        $proofPath = null;
        if ($request->hasFile('transfer_proof')) {
            $proofPath = $request->file('transfer_proof')
                ->store('transfer-proofs', 'public');
        }

        $updated = $this->paymentService
            ->confirmTransferPayment($payment, $proofPath);

        return $this->successResponse(
            new PaymentResource($updated),
            'Pembayaran transfer berhasil dikonfirmasi.'
        );
    }

    public function midtransWebhook(Request $request): JsonResponse
    {
        try {
            $this->paymentService->handleMidtransWebhook(
                $request->all()
            );
            return response()->json(['status' => 'OK']);
        } catch (\Exception $e) {
            return response()->json(
                ['status' => 'error', 'message' => $e->getMessage()],
                $e->getCode() ?: 500
            );
        }
    }
}
