<?php

namespace App\Observers;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\Payment;
use App\Events\PaymentReceived;

class PaymentObserver
{
    /**
     * Saat payment status berubah ke PAID:
     * 1. Update order status ke PROCESSING
     * 2. Catat paid_at
     * 3. Fire event PaymentReceived
     */
    public function updated(Payment $payment): void
    {
        if (!$payment->isDirty('status')) return;

        $newStatus = $payment->status instanceof \App\Enums\PaymentStatus
            ? $payment->status->value
            : $payment->status;

        if ($newStatus === PaymentStatus::PAID->value) {
            // Set paid_at jika belum ada
            if (!$payment->paid_at) {
                $payment->updateQuietly(['paid_at' => now()]);
            }

            // Update order status ke processing
            $order = $payment->order;
            if ($order && $order->status->value === OrderStatus::PENDING->value) {
                $order->update(['status' => OrderStatus::PROCESSING->value]);
            }

            // Fire event
            broadcast(new PaymentReceived($payment))->toOthers();
        }

        // Jika DP dibayar (partial), update remaining_amount
        if ($newStatus === PaymentStatus::PARTIAL->value) {
            $remaining = $payment->amount - ($payment->dp_amount ?? 0);
            $payment->updateQuietly([
                'remaining_amount' => $remaining,
                'paid_amount'      => $payment->dp_amount,
            ]);
        }
    }
}
