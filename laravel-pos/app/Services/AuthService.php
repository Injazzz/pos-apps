<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Contracts\User as SocialiteUser;

class AuthService
{
    // =========================================================
    // REGISTER
    // =========================================================

    /**
     * Daftarkan user baru.
     * Role default = pelanggan (customer self-register)
     * Role lain hanya bisa dibuat oleh manager.
     */
    public function register(array $data, ?string $role = null): array
    {
        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => $data['password'], // auto-hashed via cast
            'phone'    => $data['phone'] ?? null,
            'role'     => $role ?? UserRole::PELANGGAN->value,
            'status'   => 'active',
        ]);

        // Observer UserObserver@created akan auto-buat customer profile

        $token = $this->createToken($user);

        return [
            'user'  => $user->load('customer'),
            'token' => $token,
        ];
    }

    // =========================================================
    // LOGIN
    // =========================================================

    /**
     * Login user dengan email & password.
     * Cek status aktif sebelum izinkan login.
     */
    public function login(string $email, string $password): array
    {
        $user = User::where('email', $email)->first();

        // Cek user ada dan password cocok
        if (!$user || !Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password salah.'],
            ]);
        }

        // Cek status user aktif
        if ($user->status !== 'active') {
            throw ValidationException::withMessages([
                'email' => ['Akun Anda tidak aktif. Hubungi admin.'],
            ]);
        }

        // Revoke token lama (opsional: bisa dipertahankan untuk multi-device)
        // $user->tokens()->delete();

        $token = $this->createToken($user);

        // Load relasi sesuai role
        $this->loadUserRelations($user);

        return [
            'user'  => $user,
            'token' => $token,
        ];
    }

    // =========================================================
    // GOOGLE OAUTH
    // =========================================================

    /**
     * Handle Google OAuth callback.
     * Buat akun baru jika belum ada, atau login jika sudah ada.
     */
    public function handleGoogleLogin(SocialiteUser $googleUser): array
    {
        // Cari user by google_id atau email
        $user = User::where('google_id', $googleUser->getId())
            ->orWhere('email', $googleUser->getEmail())
            ->first();

        if ($user) {
            // Update google_id jika login by email
            if (!$user->google_id) {
                $user->update([
                    'google_id' => $googleUser->getId(),
                    'avatar'    => $googleUser->getAvatar(),
                ]);
            }

            // Cek status
            if ($user->status !== 'active') {
                throw ValidationException::withMessages([
                    'email' => ['Akun Anda tidak aktif.'],
                ]);
            }
        } else {
            // Buat akun baru
            $user = User::create([
                'name'              => $googleUser->getName(),
                'email'             => $googleUser->getEmail(),
                'password'          => Hash::make(Str::random(32)),
                'role'              => UserRole::PELANGGAN->value,
                'google_id'         => $googleUser->getId(),
                'avatar'            => $googleUser->getAvatar(),
                'status'            => 'active',
                'email_verified_at' => now(),
            ]);
        }

        $this->loadUserRelations($user);
        $token = $this->createToken($user);

        return [
            'user'  => $user,
            'token' => $token,
        ];
    }

    // =========================================================
    // LOGOUT
    // =========================================================

    public function logout(User $user): void
    {
        // Revoke hanya current token
        if ($currentToken = $user->currentAccessToken()) {
            $user->tokens()->where('id', $currentToken->id)->delete();
        }
    }

    public function logoutAll(User $user): void
    {
        // Revoke semua token (semua device)
        $user->tokens()->delete();
    }

    // =========================================================
    // PRIVATE HELPERS
    // =========================================================

    private function createToken(User $user): string
    {
        // Abilities berbeda tiap role
        $abilities = $this->getAbilitiesByRole($user);

        return $user->createToken(
            name: 'auth-token-' . $user->role->value,
            abilities: $abilities,
            expiresAt: now()->addDays(30),
        )->plainTextToken;
    }

    private function getAbilitiesByRole(User $user): array
    {
        return match ($user->role->value ?? $user->role) {
            UserRole::MANAGER->value   => ['*'], // semua akses
            UserRole::KASIR->value     => [
                'order:read', 'order:create', 'order:update-status',
                'payment:create', 'payment:read',
                'menu:read', 'receipt:print',
                'customer:read',
            ],
            UserRole::KURIR->value     => [
                'delivery:read', 'delivery:update',
                'order:read',
            ],
            UserRole::PELANGGAN->value => [
                'order:read', 'order:create',
                'cart:manage', 'payment:create',
                'profile:manage', 'review:create',
            ],
            default => [],
        };
    }

    private function loadUserRelations(User $user): void
    {
        $role = $user->role->value ?? $user->role;

        match ($role) {
            UserRole::PELANGGAN->value => $user->load('customer'),
            default                    => null,
        };
    }
}
