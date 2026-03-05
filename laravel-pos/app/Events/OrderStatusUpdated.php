<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Auth;

class OrderStatusUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly Order $order
    ) {}

    public function broadcastOn(): array
    {
        $channels = [
            // Semua manager & kasir dapat update
            new PrivateChannel('role.manager'),
            new PrivateChannel('role.kasir'),

            // Channel spesifik per order (untuk tracking realtime)
            new PrivateChannel('order.' . $this->order->id),
        ];

        // Notify customer jika order miliknya
        if ($this->order->customer_id) {
            $channels[] = new PrivateChannel(
                'customer.' . $this->order->customer->user_id
            );
        }

        // Notify kurir jika ada delivery
        if ($this->order->delivery?->courier_id) {
            $channels[] = new PrivateChannel(
                'courier.' . $this->order->delivery->courier_id
            );
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'order.status.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'order_id'     => $this->order->id,
            'order_code'   => $this->order->order_code,
            'old_status'   => $this->order->getOriginal('status'),
            'new_status'   => $this->order->status->value ?? $this->order->status,
            'status_label' => $this->order->status_label,
            'updated_by'   => Auth::user()?->name ?? 'System',
            'updated_at'   => now()->toISOString(),
        ];
    }

    public function broadcastQueue(): string
    {
        return 'broadcasts';
    }
}
