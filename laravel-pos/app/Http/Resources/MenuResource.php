<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MenuResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'name'            => $this->name,
            'price'           => (float) $this->price,
            'formatted_price' => $this->formatted_price,
            'category'        => $this->category,
            'description'     => $this->description,
            'image_url'       => $this->image_url,
            'is_available'    => $this->is_available,
            'is_in_stock'     => $this->is_in_stock,
            'stock'           => $this->stock,
            'sort_order'      => $this->sort_order,
            'created_at'      => $this->created_at?->toISOString(),
        ];
    }
}
