<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                    => $this->id,
            'order_code'            => $this->order_code,
            'order_type'            => $this->order_type->value ?? $this->order_type,
            'order_type_label'      => $this->order_type_label,
            'status'                => $this->status->value ?? $this->status,
            'status_label'          => $this->status_label,
            'subtotal'              => (float) $this->subtotal,
            'discount'              => (float) $this->discount,
            'delivery_fee'          => (float) $this->delivery_fee,
            'total_price'           => (float) $this->total_price,
            'formatted_total'       => $this->formatted_total,
            'delivery_address'      => $this->delivery_address,
            'customer_name'         => $this->customer_display_name,
            'customer_phone'        => $this->customer_display_phone,
            'notes'                 => $this->notes,
            'source'                => $this->source,
            'is_paid'               => $this->is_paid,
            'can_be_cancelled'      => $this->can_be_cancelled,
            'created_at'            => $this->created_at?->toISOString(),
            'updated_at'            => $this->updated_at?->toISOString(),

            // Relasi (hanya kalau di-load)
            'customer'              => $this->whenLoaded('customer',
                fn() => new CustomerResource($this->customer)
            ),
            'cashier'               => $this->whenLoaded('cashier',
                fn() => new UserResource($this->cashier)
            ),
            'items'                 => $this->whenLoaded('items',
                fn() => OrderItemResource::collection($this->items)
            ),
            'payment'               => $this->whenLoaded('payment',
                fn() => new PaymentResource($this->payment)
            ),
            'delivery'              => $this->whenLoaded('delivery',
                fn() => new DeliveryResource($this->delivery)
            ),
            'status_logs'           => $this->whenLoaded('statusLogs',
                fn() => OrderStatusLogResource::collection($this->statusLogs)
            ),
        ];
    }
}
