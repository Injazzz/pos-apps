<?php

namespace App\Http\Controllers\Api\Cashier;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Order\CreateOrderRequest;
use App\Http\Requests\Order\UpdateOrderStatusRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

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

    public function store(CreateOrderRequest $request): JsonResponse
    {
        $this->authorize('create', Order::class);

        $order = $this->orderService->createOrder(
            $request->validated(),
            $request->user()
        );

        return $this->createdResponse(
            new OrderResource($order),
            'Order berhasil dibuat.'
        );
    }

    public function show(Order $order): JsonResponse
    {
        $this->authorize('view', $order);

        return $this->successResponse(
            new OrderResource($order->load([
                'items.menu', 'customer.user',
                'payment', 'delivery', 'statusLogs.updater',
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
}
