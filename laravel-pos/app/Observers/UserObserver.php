<?php

namespace App\Observers;

use App\Enums\UserRole;
use App\Models\User;

class UserObserver
{
    /**
     * Saat user baru dibuat dengan role pelanggan,
     * otomatis buat record di tabel customers
     */
    public function created(User $user): void
    {
        $role = $user->role instanceof UserRole
            ? $user->role->value
            : $user->role;

        if ($role === UserRole::PELANGGAN->value) {
            $user->customer()->firstOrCreate([
                'user_id' => $user->id,
            ]);
        }
    }

    /**
     * Saat user dihapus (soft delete), revoke semua token
     */
    public function deleted(User $user): void
    {
        $user->tokens()->delete();
    }
}
