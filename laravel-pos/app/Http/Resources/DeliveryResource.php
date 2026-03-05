<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DeliveryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'order_id'         => $this->order_id,
            'courier_id'       => $this->courier_id,
            'address'          => $this->address,
            'recipient_name'   => $this->recipient_name,
            'recipient_phone'  => $this->recipient_phone,
            'delivery_status'  => $this->delivery_status->value ?? $this->delivery_status,
            'status_label'     => $this->status_label,
            'proof_photo_url'  => $this->proof_photo_url,
            'proof_taken_at'   => $this->proof_taken_at?->toISOString(),
            'delivery_notes'   => $this->delivery_notes,
            'delivered_at'     => $this->delivered_at?->toISOString(),
            'is_delivered'     => $this->is_delivered,
            'created_at'       => $this->created_at?->toISOString(),

            'courier'          => $this->whenLoaded('courier',
                fn() => new UserResource($this->courier)
            ),
        ];
    }
}
