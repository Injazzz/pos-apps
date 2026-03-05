<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class UserPolicy
{
    /*
    |------------------------------------------------------------------
    | VIEW ANY — Lihat daftar user
    |------------------------------------------------------------------
    */
    public function viewAny(User $user): bool
    {
        return $user->isManager();
    }

    /*
    |------------------------------------------------------------------
    | VIEW — Lihat detail user
    |------------------------------------------------------------------
    */
    public function view(User $user, User $targetUser): bool
    {
        // Manager bisa lihat semua
        if ($user->isManager()) return true;

        // User hanya bisa lihat profil sendiri
        return $user->id === $targetUser->id;
    }

    /*
    |------------------------------------------------------------------
    | CREATE — Buat user baru
    |------------------------------------------------------------------
    */
    public function create(User $user): bool
    {
        return $user->isManager();
    }

    /*
    |------------------------------------------------------------------
    | UPDATE — Edit data user
    |------------------------------------------------------------------
    */
    public function update(User $user, User $targetUser): Response
    {
        // Manager bisa update siapa saja
        if ($user->isManager()) {
            // Tapi tidak bisa downgrade sesama manager
            // (kecuali dirinya sendiri)
            if ($targetUser->isManager() && $user->id !== $targetUser->id) {
                $requestedRole = request()->input('role');
                if ($requestedRole && $requestedRole !== UserRole::MANAGER->value) {
                    return Response::deny(
                        'Tidak bisa mengubah role sesama manager.'
                    );
                }
            }
            return Response::allow();
        }

        // User biasa hanya bisa update diri sendiri
        if ($user->id === $targetUser->id) {
            // Tidak boleh ubah role sendiri
            if (request()->has('role')) {
                return Response::deny('Anda tidak bisa mengubah role sendiri.');
            }
            return Response::allow();
        }

        return Response::deny('Anda tidak diizinkan mengubah data user lain.');
    }

    /*
    |------------------------------------------------------------------
    | DELETE — Hapus user
    |------------------------------------------------------------------
    */
    public function delete(User $user, User $targetUser): Response
    {
        if (!$user->isManager()) {
            return Response::deny('Hanya manager yang bisa menghapus user.');
        }

        // Tidak bisa hapus diri sendiri
        if ($user->id === $targetUser->id) {
            return Response::deny('Tidak bisa menghapus akun Anda sendiri.');
        }

        // Tidak bisa hapus manager lain
        if ($targetUser->isManager()) {
            return Response::deny('Tidak bisa menghapus akun manager.');
        }

        return Response::allow();
    }

    /*
    |------------------------------------------------------------------
    | TOGGLE STATUS — Aktifkan/nonaktifkan user
    |------------------------------------------------------------------
    */
    public function toggleStatus(User $user, User $targetUser): Response
    {
        if (!$user->isManager()) {
            return Response::deny('Hanya manager yang bisa mengubah status user.');
        }

        if ($user->id === $targetUser->id) {
            return Response::deny('Tidak bisa mengubah status akun Anda sendiri.');
        }

        if ($targetUser->isManager()) {
            return Response::deny('Tidak bisa mengubah status akun manager lain.');
        }

        return Response::allow();
    }
}
