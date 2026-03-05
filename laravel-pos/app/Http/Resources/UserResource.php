<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'name'       => $this->name,
            'email'      => $this->email,
            'role'       => $this->role->value ?? $this->role,
            'role_label' => $this->role_label,
            'phone'      => $this->phone,
            'status'     => $this->status,
            'avatar_url' => $this->avatar_url,
            'is_active'  => $this->is_active,
            'created_at' => $this->created_at?->toISOString(),

            // Relasi (loaded kalau ada)
            'customer'   => $this->whenLoaded('customer',
                fn() => new CustomerResource($this->customer)
            ),
        ];
    }
}
