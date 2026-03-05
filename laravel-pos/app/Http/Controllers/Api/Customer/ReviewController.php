<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\Order;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReviewController extends BaseApiController
{
    public function store(Request $request, Order $order): JsonResponse
    {
        $request->validate([
            'rating'     => 'required|integer|min:1|max:5',
            'comment'    => 'nullable|string|max:1000',
        ]);

        // Check if order belongs to user
        if ($order->customer_id !== Auth::user()->customer?->id) {
            return $this->errorResponse('Unauthorized', 403);
        }

        // Check if order is completed
        if ($order->status !== 'completed') {
            return $this->errorResponse('Pesanan harus selesai untuk memberikan review.', 422);
        }

        // Check if review already exists
        if ($order->review) {
            return $this->errorResponse('Review untuk pesanan ini sudah ada.', 422);
        }

        $review = Review::create([
            'order_id'   => $order->id,
            'rating'     => $request->input('rating'),
            'comment'    => $request->input('comment'),
            'customer_id'=> Auth::user()->customer->id,
        ]);

        return $this->createdResponse(
            $review,
            'Review berhasil ditambahkan.'
        );
    }
}
