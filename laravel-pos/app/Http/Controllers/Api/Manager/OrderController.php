<?php

namespace App\Http\Controllers\Api\Manager;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Order\AssignCourierRequest;
use App\Http\Requests\Order\UpdateOrderStatusRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends BaseApiController
{
    use AuthorizesRequests;

    public function __construct(
        private readonly OrderService $orderService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $orders = $this->orderService->getOrdersForUser(
            $request->user(),
            $request->only(['status', 'order_type', 'date', 'search', 'per_page'])
        );

        return $this->successResponse(
            OrderResource::collection($orders)->response()->getData(true),
            'Daftar order berhasil diambil.'
        );
    }

    public function show(Order $order): JsonResponse
    {
        return $this->successResponse(
            new OrderResource($order->load([
                'items.menu', 'customer.user', 'cashier',
                'payment', 'delivery.courier', 'statusLogs.updater',
            ])),
            'Detail order berhasil diambil.'
        );
    }

    public function updateStatus(
        UpdateOrderStatusRequest $request,
        Order $order
    ): JsonResponse {
        $this->authorize('updateStatus', $order);

        $updated = $this->orderService->updateStatus(
            $order,
            $request->status,
            $request->user(),
            $request->reason
        );

        return $this->successResponse(
            new OrderResource($updated),
            'Status order berhasil diperbarui.'
        );
    }

    public function assignCourier(
        AssignCourierRequest $request,
        Order $order
    ): JsonResponse {
        $this->authorize('assignCourier', $order);

        $updated = $this->orderService->assignCourier(
            $order,
            $request->courier_id
        );

        return $this->successResponse(
            new OrderResource($updated),
            'Kurir berhasil di-assign.'
        );
    }
}
