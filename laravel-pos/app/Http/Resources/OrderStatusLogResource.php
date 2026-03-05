<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderStatusLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'status'          => $this->status->value ?? $this->status,
            'status_label'    => $this->status_label,
            'reason'          => $this->reason,
            'updated_by_role' => $this->updated_by_role,
            'updated_at'      => $this->updated_at?->toISOString(),
            'updater'         => $this->whenLoaded('updater',
                fn() => new UserResource($this->updater)
            ),
        ];
    }
}
