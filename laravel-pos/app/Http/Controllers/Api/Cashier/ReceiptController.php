<?php
// app/Http/Controllers/Api/Cashier/ReceiptController.php

namespace App\Http\Controllers\Api\Cashier;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\Order;
use App\Services\ReceiptService;
use Illuminate\Http\JsonResponse;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class ReceiptController extends BaseApiController
{
    use AuthorizesRequests;

    public function __construct(
        private readonly ReceiptService $receiptService
    ) {}

    /**
     * GET /api/cashier/orders/{order}/receipt
     * Return data receipt sebagai JSON — frontend yang print
     */
    public function generate(Order $order): JsonResponse
    {
        $this->authorize('print-receipt');

        $data = $this->receiptService->generateReceiptData($order);

        return $this->successResponse(
            $data,
            'Data receipt berhasil dibuat.'
        );
    }
}
