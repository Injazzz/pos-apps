<?php

namespace App\Services;

use App\Models\Order;
use Midtrans\Config;
use Midtrans\Snap;

class MidtransService
{
    public function __construct()
    {
        Config::$serverKey    = config('midtrans.server_key');
        Config::$isProduction = config('midtrans.is_production');
        Config::$isSanitized  = config('midtrans.is_sanitized');
        Config::$is3ds        = config('midtrans.is_3ds');
    }

    // =========================================================
    // CREATE SNAP TOKEN
    // =========================================================

    public function createSnapToken(Order $order): array
    {
        $customer = $order->customer?->user ?? null;

        $params = [
            'transaction_details' => [
                'order_id'     => 'POS-' . $order->order_code,
                'gross_amount' => (int) $order->total_price,
            ],

            'customer_details' => [
                'first_name' => $customer?->name ?? $order->customer_name ?? 'Guest',
                'email'      => $customer?->email ?? 'guest@pos.com',
                'phone'      => $customer?->phone ?? $order->customer_phone ?? '',
            ],

            'item_details' => $this->buildItemDetails($order),

            'callbacks' => [
                'finish' => config('app.frontend_url') . '/customer/orders/' . $order->id,
            ],

            'expiry' => [
                'start_time' => now()->format('Y-m-d H:i:s O'),
                'unit'       => 'hours',
                'duration'   => 24,
            ],
        ];

        $snapToken   = Snap::getSnapToken($params);
        $snapUrl     = config('midtrans.is_production')
            ? "https://app.midtrans.com/snap/v2/vtweb/{$snapToken}"
            : "https://app.sandbox.midtrans.com/snap/v2/vtweb/{$snapToken}";

        return [
            'token'        => $snapToken,
            'redirect_url' => $snapUrl,
        ];
    }

    // =========================================================
    // VERIFY WEBHOOK SIGNATURE
    // =========================================================

    public function verifyWebhookSignature(array $payload): void
    {
        $orderId           = $payload['order_id'];
        $statusCode        = $payload['status_code'];
        $grossAmount       = $payload['gross_amount'];
        $serverKey         = config('midtrans.server_key');

        $signatureKey = hash(
            'sha512',
            $orderId . $statusCode . $grossAmount . $serverKey
        );

        if ($signatureKey !== $payload['signature_key']) {
            throw new \Exception('Invalid Midtrans signature.', 403);
        }
    }

    // =========================================================
    // PRIVATE HELPERS
    // =========================================================

    private function buildItemDetails(Order $order): array
    {
        $items = $order->items->map(fn($item) => [
            'id'       => (string) $item->menu_id,
            'price'    => (int) $item->price,
            'quantity' => $item->qty,
            'name'     => $item->menu?->name ?? 'Menu',
        ])->toArray();

        // Tambah delivery fee sebagai item jika ada
        if ($order->delivery_fee > 0) {
            $items[] = [
                'id'       => 'DELIVERY_FEE',
                'price'    => (int) $order->delivery_fee,
                'quantity' => 1,
                'name'     => 'Ongkos Kirim',
            ];
        }

        return $items;
    }
}
