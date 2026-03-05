<?php

namespace App\Observers;

use App\Models\Order;
use App\Models\OrderStatusLog;
use App\Events\OrderCreated;
use App\Events\OrderStatusUpdated;
use Illuminate\Support\Facades\Auth;

class OrderObserver
{
    /**
     * Saat order baru dibuat:
     * 1. Auto-generate order_code
     * 2. Log status awal ke order_status_logs
     * 3. Fire event OrderCreated (WebSocket)
     */
    public function creating(Order $order): void
    {
        if (empty($order->order_code)) {
            $order->order_code = Order::generateOrderCode();
        }
    }

    public function created(Order $order): void
    {
        // Catat status awal di log
        OrderStatusLog::create([
            'order_id'       => $order->id,
            'status'         => $order->status,
            'updated_by'     => $order->cashier_id ?? Auth::id(),
            'updated_by_role'=> Auth::user()?->role->value ?? 'system',
            'reason'         => 'Pesanan dibuat',
            'updated_at'     => now(),
        ]);

        // Fire WebSocket event
        broadcast(new OrderCreated($order))->toOthers();
    }

    /**
     * Saat status order berubah:
     * 1. Catat ke order_status_logs
     * 2. Fire event OrderStatusUpdated
     */
    public function updated(Order $order): void
    {
        if ($order->isDirty('status')) {
            // Catat perubahan status
            OrderStatusLog::create([
                'order_id'       => $order->id,
                'status'         => $order->status,
                'updated_by'     => Auth::id(),
                'updated_by_role'=> Auth::user()?->role->value ?? 'system',
                'reason'         => request()->input('reason'),
                'updated_at'     => now(),
            ]);

            // Fire WebSocket event untuk notifikasi realtime
            broadcast(new OrderStatusUpdated($order))->toOthers();
        }
    }
}
