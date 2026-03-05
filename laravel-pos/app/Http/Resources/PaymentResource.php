<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                      => $this->id,
            'order_id'                => $this->order_id,
            'method'                  => $this->method->value ?? $this->method,
            'method_label'            => $this->method_label,
            'status'                  => $this->status->value ?? $this->status,
            'status_label'            => $this->status_label,
            'amount'                  => (float) $this->amount,
            'formatted_amount'        => $this->formatted_amount,
            'dp_amount'               => (float) ($this->dp_amount ?? 0),
            'remaining_amount'        => (float) ($this->remaining_amount ?? 0),
            'paid_amount'             => (float) ($this->paid_amount ?? 0),
            'cash_received'           => (float) ($this->cash_received ?? 0),
            'change_amount'           => (float) ($this->change_amount ?? 0),
            'is_paid'                 => $this->is_paid,
            'is_down_payment'         => $this->is_down_payment,
            'midtrans_token'          => $this->midtrans_token,
            'midtrans_url'            => $this->midtrans_url,
            'transfer_proof_url'      => $this->transfer_proof_url,
            'bank_name'               => $this->bank_name,
            'paid_at'                 => $this->paid_at?->toISOString(),
            'expired_at'              => $this->expired_at?->toISOString(),
            'created_at'              => $this->created_at?->toISOString(),
        ];
    }
}
