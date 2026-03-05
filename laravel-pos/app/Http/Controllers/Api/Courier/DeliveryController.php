<?php

namespace App\Http\Controllers\Api\Courier;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Delivery\UpdateDeliveryStatusRequest;
use App\Http\Requests\Delivery\UploadProofRequest;
use App\Http\Resources\DeliveryResource;
use App\Models\Delivery;
use App\Services\DeliveryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class DeliveryController extends BaseApiController
{
    use AuthorizesRequests;

    public function __construct(
        private readonly DeliveryService $deliveryService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Delivery::class);

        $deliveries = $this->deliveryService->getDeliveriesForCourier(
            $request->user(),
            $request->only(['delivery_status', 'per_page'])
        );

        return $this->successResponse(
            DeliveryResource::collection($deliveries)->response()->getData(true),
            'Daftar pengiriman berhasil diambil.'
        );
    }

    public function show(Delivery $delivery): JsonResponse
    {
        $this->authorize('view', $delivery);

        return $this->successResponse(
            new DeliveryResource($delivery->load([
                'order.items.menu',
                'order.customer.user',
                'courier',
            ])),
            'Detail pengiriman berhasil diambil.'
        );
    }

    public function updateStatus(
        UpdateDeliveryStatusRequest $request,
        Delivery $delivery
    ): JsonResponse {
        $this->authorize('updateStatus', $delivery);

        $updated = $this->deliveryService->updateStatus(
            $delivery,
            $request->delivery_status,
            $request->user()
        );

        return $this->successResponse(
            new DeliveryResource($updated),
            'Status pengiriman berhasil diperbarui.'
        );
    }

    public function uploadProof(
        UploadProofRequest $request,
        Delivery $delivery
    ): JsonResponse {
        $this->authorize('uploadProof', $delivery);

        $updated = $this->deliveryService->uploadProof(
            $delivery,
            $request->file('proof_photo'),
            $request->user(),
            $request->notes
        );

        return $this->successResponse(
            new DeliveryResource($updated),
            'Bukti pengiriman berhasil diupload.'
        );
    }
}
