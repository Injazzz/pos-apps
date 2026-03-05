<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'user_id'      => $this->user_id,
            'address'      => $this->address,
            'city'         => $this->city,
            'province'     => $this->province,
            'postal_code'  => $this->postal_code,
            'full_address' => $this->full_address,
            'notes'        => $this->notes,
            'user'         => $this->whenLoaded('user',
                fn() => new UserResource($this->user)
            ),
        ];
    }
}
