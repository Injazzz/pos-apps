<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class RegisterController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly AuthService $authService
    ) {}

    /**
     * POST /api/auth/register
     *
     * Publik bisa register sebagai pelanggan.
     * Manager bisa register semua role via panel admin.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $result = $this->authService->register(
            data: $request->validated(),
            role: $request->input('role'),
        );

        return $this->createdResponse(
            data: [
                'user'  => new UserResource($result['user']),
                'token' => $result['token'],
            ],
            message: 'Registrasi berhasil. Selamat datang!'
        );
    }
}
