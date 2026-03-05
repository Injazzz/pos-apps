<?php

namespace App\Services;

use App\Models\Delivery;
use App\Models\User;
use App\Events\DeliveryStatusUpdated;

class DeliveryService
{
    public function __construct(
        private readonly StatusTransitionService $transitionService
    ) {}

    public function updateStatus(
        Delivery $delivery,
        string   $newStatus,
        User     $actor
    ): Delivery {
        return $this->transitionService
            ->transitionDeliveryStatus($delivery, $newStatus, $actor);
            broadcast(new DeliveryStatusUpdated($delivery->fresh()))->toOthers();
    }

    /**
     * Upload foto bukti pengiriman + tambah watermark timestamp
     */
    public function uploadProof(
        Delivery $delivery,
        \Illuminate\Http\UploadedFile $photo,
        User $actor,
        ?string $notes = null
    ): Delivery {
        // Simpan foto
        $filename  = 'delivery-proof/' . $delivery->id
            . '-' . now()->format('YmdHis')
            . '.' . $photo->getClientOriginalExtension();

        // Simpan file asli
        $path = $photo->storeAs(
            'delivery-proof',
            basename($filename),
            'public'
        );

        // Catat waktu pengambilan foto + update delivery
        $updateData = [
            'proof_photo'    => $path,
            'proof_taken_at' => now(),
        ];

        if ($notes) {
            $updateData['delivery_notes'] = $notes;
        }

        $delivery->update($updateData);

        return $delivery->fresh(['order', 'courier']);
    }

    public function getDeliveriesForCourier(User $courier, array $filters = [])
    {
        $query = Delivery::with(['order.items.menu', 'order.customer.user'])
            ->byCourier($courier->id);

        if (!empty($filters['delivery_status'])) {
            $query->where('delivery_status', $filters['delivery_status']);
        }

        return $query->orderByDesc('created_at')
                     ->paginate($filters['per_page'] ?? 15);
    }
}
