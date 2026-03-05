<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Order\CreateOrderRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\OrderService;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class OrderController extends BaseApiController
{
    use AuthorizesRequests;

    public function __construct(
        private readonly OrderService   $orderService,
        private readonly PaymentService $paymentService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $orders = $this->orderService->getOrdersForUser(
            $request->user(),
            $request->only(['status', 'per_page'])
        );

        return $this->successResponse(
            OrderResource::collection($orders)->response()->getData(true),
            'Riwayat pesanan berhasil diambil.'
        );
    }

    public function store(CreateOrderRequest $request): JsonResponse
    {
        $this->authorize('create', Order::class);

        $data = array_merge(
            $request->validated(),
            [
                'customer_id' => $request->user()->customer?->id,
                'source'      => 'app',
            ]
        );

        $order = $this->orderService->createOrder($data, $request->user());

        return $this->createdResponse(
            new OrderResource($order),
            'Pesanan berhasil dibuat.'
        );
    }

    public function show(Order $order): JsonResponse
    {
        $this->authorize('view', $order);

        return $this->successResponse(
            new OrderResource($order->load([
                'items.menu', 'payment',
                'delivery', 'statusLogs',
            ])),
            'Detail pesanan berhasil diambil.'
        );
    }

    public function markCompleted(Order $order): JsonResponse
    {
        $this->authorize('complete', $order);

        $updated = $this->orderService->updateStatus(
            $order,
            'completed',
            request()->user()
        );

        return $this->successResponse(
            new OrderResource($updated),
            'Pesanan berhasil dikonfirmasi diterima.'
        );
    }

    public function createSnap(Order $order): JsonResponse
    {
        $this->authorize('create', [\App\Models\Payment::class, $order]);

        $payment = $this->paymentService->createMidtransSnap(
            $order,
            request()->user()
        );

        return $this->successResponse(
            [
                'payment'      => new \App\Http\Resources\PaymentResource($payment),
                'snap_token'   => $payment->midtrans_token,
                'snap_url'     => $payment->midtrans_url,
                'client_key'   => config('midtrans.client_key'),
            ],
            'Snap token berhasil dibuat.'
        );
    }
}
