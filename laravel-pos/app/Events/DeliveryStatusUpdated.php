<?php

namespace App\Events;

use App\Models\Delivery;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DeliveryStatusUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly Delivery $delivery
    ) {}

    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('role.manager'),
        ];

        // Notify customer order
        $customerId = $this->delivery->order?->customer?->user_id;
        if ($customerId) {
            $channels[] = new PrivateChannel("customer.{$customerId}");
        }

        // Notify kurir yang di-assign
        if ($this->delivery->courier_id) {
            $channels[] = new PrivateChannel(
                "courier.{$this->delivery->courier_id}"
            );
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'delivery.status.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'delivery_id'    => $this->delivery->id,
            'order_id'       => $this->delivery->order_id,
            'order_code'     => $this->delivery->order?->order_code,
            'delivery_status'=> $this->delivery->delivery_status->value
                ?? $this->delivery->delivery_status,
            'status_label'   => $this->delivery->status_label,
            'courier_name'   => $this->delivery->courier?->name,
            'proof_photo_url'=> $this->delivery->proof_photo_url,
            'updated_at'     => now()->toISOString(),
        ];
    }
}
