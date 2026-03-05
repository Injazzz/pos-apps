<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ProfileController extends BaseApiController
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user()->load('customer');

        return $this->successResponse(
            new UserResource($user),
            'Profil berhasil diambil.'
        );
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'     => 'sometimes|string|max:255',
            'phone'    => 'sometimes|string|max:20',
            'password' => 'sometimes|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user->update($validated);

        return $this->successResponse(
            new UserResource($user),
            'Profil berhasil diperbarui.'
        );
    }

    public function getStats(Request $request): JsonResponse
    {
        $user = $request->user();

        $stats = [
            'total_orders'     => $user->orders()->count(),
            'completed_orders' => $user->orders()->where('status', 'completed')->count(),
            'total_spent'      => $user->orders()->where('status', 'completed')->sum('total_price'),
        ];

        return $this->successResponse($stats, 'Statistik berhasil diambil.');
    }

    public function getAddresses(Request $request): JsonResponse
    {
        $customer = $request->user()->customer;

        if (!$customer) {
            return $this->successResponse([], 'Alamat tidak ditemukan.');
        }

        return $this->successResponse(
            [$customer->only(['id', 'address', 'city', 'province', 'postal_code'])],
            'Alamat berhasil diambil.'
        );
    }
}
