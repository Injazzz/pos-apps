<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                 => $this->id,
            'order_id'           => $this->order_id,
            'menu_id'            => $this->menu_id,
            'qty'                => $this->qty,
            'price'              => (float) $this->price,
            'subtotal'           => (float) $this->subtotal,
            'formatted_price'    => $this->formatted_price,
            'formatted_subtotal' => $this->formatted_subtotal,
            'note'               => $this->note,
            'menu'               => $this->whenLoaded('menu',
                fn() => new MenuResource($this->menu)
            ),
        ];
    }
}
