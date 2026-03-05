<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class LoginController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly AuthService $authService
    ) {}

    /**
     * POST /api/auth/login
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->authService->login(
            email: $request->email,
            password: $request->password,
        );

        return $this->successResponse(
            data: [
                'user'  => new UserResource($result['user']),
                'token' => $result['token'],
            ],
            message: 'Login berhasil. Selamat datang, ' . $result['user']->name . '!'
        );
    }

    /**
     * POST /api/auth/logout
     */
    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user());

        return $this->successResponse(
            message: 'Logout berhasil.'
        );
    }

    /**
     * POST /api/auth/logout-all
     * Logout dari semua device
     */
    public function logoutAll(Request $request): JsonResponse
    {
        $this->authService->logoutAll($request->user());

        return $this->successResponse(
            message: 'Berhasil logout dari semua perangkat.'
        );
    }

    /**
     * GET /api/auth/me
     * Ambil data user yang sedang login
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('customer');

        return $this->successResponse(
            data: new UserResource($user),
            message: 'Data user berhasil diambil.'
        );
    }

    /**
     * PUT /api/auth/profile
     * Update profil user yang sedang login
     */
    public function updateProfile(
        UpdateProfileRequest $request
    ): JsonResponse {
        $user      = $request->user();
        $validated = $request->validated();

        // Validasi password lama jika ingin ganti password
        if ($request->filled('new_password')) {
            if (!Hash::check($request->current_password, $user->password)) {
                return $this->validationErrorResponse(
                    errors: ['current_password' => ['Password lama tidak sesuai.']],
                );
            }
            $validated['password'] = $request->new_password;
        }

        // Update user fields
        $userFields = array_filter(
            $validated,
            fn($key) => in_array($key, [
                'name', 'email', 'phone', 'password'
            ]),
            ARRAY_FILTER_USE_KEY
        );

        if (!empty($userFields)) {
            $user->update($userFields);
        }

        // Update customer profile jika pelanggan
        if ($user->isPelanggan()) {
            $customerFields = array_filter(
                $validated,
                fn($key) => in_array($key, [
                    'address', 'city', 'province', 'postal_code', 'notes'
                ]),
                ARRAY_FILTER_USE_KEY
            );

            if (!empty($customerFields)) {
                $user->customer()->updateOrCreate(
                    ['user_id' => $user->id],
                    $customerFields
                );
            }
        }

        $user->load('customer');

        return $this->successResponse(
            data: new UserResource($user),
            message: 'Profil berhasil diperbarui.'
        );
    }
}
