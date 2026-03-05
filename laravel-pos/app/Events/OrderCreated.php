<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly Order $order
    ) {}

    /**
     * Channel yang menerima event ini:
     * 1. managers    - semua manager dapat notif order baru
     * 2. kasir-channel - semua kasir dapat notif
     * 3. customer    - customer yang buat order
     */
    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('role.manager'),
            new PrivateChannel('role.kasir'),
        ];

        // Jika order dari customer (ada customer_id), notify customer juga
        if ($this->order->customer_id) {
            $channels[] = new PrivateChannel(
                'customer.' . $this->order->customer->user_id
            );
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'order.created';
    }

    public function broadcastWith(): array
    {
        return [
            'order_id'     => $this->order->id,
            'order_code'   => $this->order->order_code,
            'order_type'   => $this->order->order_type->value ?? $this->order->order_type,
            'status'       => $this->order->status->value ?? $this->order->status,
            'total_price'  => (float) $this->order->total_price,
            'customer_name'=> $this->order->customer_display_name,
            'items_count'  => $this->order->items->count(),
            'created_at'   => $this->order->created_at->toISOString(),
        ];
    }

    /**
     * Queue channel untuk broadcast
     */
    public function broadcastQueue(): string
    {
        return 'broadcasts';
    }
}
