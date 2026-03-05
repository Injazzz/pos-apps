<?php

namespace App\Services;

use App\Models\Order;

class ReceiptService
{
    /**
     * Generate data receipt untuk dikirim ke frontend.
     * Frontend yang handle print ke thermal printer.
     */
    public function generateReceiptData(Order $order): array
    {
        $order->load([
            'items.menu',
            'customer.user',
            'payment',
            'cashier',
        ]);

        return [
            'store' => [
                'name'    => config('app.name', 'POS Delivery Order'),
                'address' => 'Jl. Contoh No. 123, Jakarta',
                'phone'   => '021-12345678',
                'tagline' => 'Terima kasih atas pesanan Anda!',
            ],

            'receipt_number' => $order->order_code,
            'date'           => $order->created_at->format('d/m/Y H:i'),
            'cashier'        => $order->cashier?->name ?? 'Sistem',
            'order_type'     => $order->order_type_label,

            'customer' => [
                'name'  => $order->customer_display_name,
                'phone' => $order->customer_display_phone,
            ],

            'items' => $order->items->map(fn($item) => [
                'name'     => $item->menu?->name ?? '-',
                'qty'      => $item->qty,
                'price'    => (float) $item->price,
                'subtotal' => (float) $item->subtotal,
                'note'     => $item->note,
            ])->toArray(),

            'subtotal'     => (float) $order->subtotal,
            'discount'     => (float) $order->discount,
            'delivery_fee' => (float) $order->delivery_fee,
            'total'        => (float) $order->total_price,

            'payment' => [
                'method'        => $order->payment?->method_label ?? '-',
                'status'        => $order->payment?->status_label ?? '-',
                'paid_amount'   => (float) ($order->payment?->paid_amount ?? 0),
                'cash_received' => (float) ($order->payment?->cash_received ?? 0),
                'change'        => (float) ($order->payment?->change_amount ?? 0),
                'dp_amount'     => (float) ($order->payment?->dp_amount ?? 0),
                'remaining'     => (float) ($order->payment?->remaining_amount ?? 0),
            ],

            'notes'       => $order->notes,
            'footer'      => 'Simpan struk ini sebagai bukti pembayaran.',
            'wifi_info'   => 'WiFi: POS_GUEST | Pass: 12345678',
        ];
    }
}
