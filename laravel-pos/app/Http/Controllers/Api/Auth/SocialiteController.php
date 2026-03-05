<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Laravel\Socialite\Facades\Socialite;

class SocialiteController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly AuthService $authService
    ) {}

    /**
     * GET /api/auth/google
     * Redirect ke Google OAuth
     */
    public function redirectToGoogle(): RedirectResponse
    {
        return Socialite::driver('google')
            ->stateless()
            ->redirect();
    }

    /**
     * GET /api/auth/google/callback
     * Handle callback dari Google
     */
    public function handleGoogleCallback(): JsonResponse|RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')
                ->stateless()
                ->user();

            $result = $this->authService->handleGoogleLogin($googleUser);

            // Redirect ke frontend dengan token
            $frontendUrl = config('app.frontend_url', 'http://localhost:5173');

            return redirect(
                $frontendUrl . '/auth/callback?' . http_build_query([
                    'token' => $result['token'],
                    'user'  => json_encode(
                        (new UserResource($result['user']))->toArray(request())
                    ),
                ])
            );
        } catch (\Exception $e) {
            $frontendUrl = config('app.frontend_url', 'http://localhost:5173');

            return redirect(
                $frontendUrl . '/login?error=' . urlencode($e->getMessage())
            );
        }
    }
}
