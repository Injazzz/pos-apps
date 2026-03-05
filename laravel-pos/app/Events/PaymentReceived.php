<?php

namespace App\Events;

use App\Models\Payment;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PaymentReceived implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly Payment $payment
    ) {}

    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('role.manager'),
            new PrivateChannel('role.kasir'),
        ];

        // Notify customer
        $customerId = $this->payment->order?->customer?->user_id;
        if ($customerId) {
            $channels[] = new PrivateChannel("customer.{$customerId}");
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'payment.received';
    }

    public function broadcastWith(): array
    {
        return [
            'payment_id'   => $this->payment->id,
            'order_id'     => $this->payment->order_id,
            'order_code'   => $this->payment->order?->order_code,
            'method'       => $this->payment->method->value ?? $this->payment->method,
            'method_label' => $this->payment->method_label,
            'amount'       => (float) $this->payment->amount,
            'status'       => $this->payment->status->value ?? $this->payment->status,
            'paid_at'      => $this->payment->paid_at?->toISOString(),
        ];
    }

    public function broadcastQueue(): string
    {
        return 'broadcasts';
    }
}
