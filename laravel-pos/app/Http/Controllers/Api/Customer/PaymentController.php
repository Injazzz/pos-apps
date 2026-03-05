<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\Order;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends BaseApiController
{
    public function __construct(
        private readonly PaymentService $paymentService
    ) {}

    public function createSnap(Request $request, Order $order): JsonResponse
    {
        $request->validate([
            'payment_method' => 'required|string|in:midtrans,transfer_bank,qris',
        ]);

        // Create payment via Midtrans Snap
        $snap = $this->paymentService->createMidtransSnap(
            $order,
            $request->user()
        );

        if (!$snap) {
            return $this->errorResponse(
                'Gagal membuat payment snap.',
                401
            );
        }

        return $this->successResponse(
            [
                'snap_token' => $snap['token'],
                'snap_url'   => $snap['redirect_url'],
            ],
            'Snap payment berhasil dibuat.'
        );
    }
}
