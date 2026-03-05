<?php

namespace App\Policies;

use App\Models\Menu;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class MenuPolicy
{
    /*
    |------------------------------------------------------------------
    | VIEW ANY — Semua orang bisa lihat menu (termasuk guest)
    |------------------------------------------------------------------
    */
    public function viewAny(?User $user): bool
    {
        return true; // public endpoint
    }

    /*
    |------------------------------------------------------------------
    | VIEW — Lihat detail menu
    |------------------------------------------------------------------
    */
    public function view(?User $user, Menu $menu): bool
    {
        return true; // public
    }

    /*
    |------------------------------------------------------------------
    | CREATE — Hanya manager
    |------------------------------------------------------------------
    */
    public function create(User $user): bool
    {
        return $user->isManager();
    }

    /*
    |------------------------------------------------------------------
    | UPDATE — Hanya manager
    |------------------------------------------------------------------
    */
    public function update(User $user, Menu $menu): bool
    {
        return $user->isManager();
    }

    /*
    |------------------------------------------------------------------
    | DELETE — Hanya manager
    |------------------------------------------------------------------
    */
    public function delete(User $user, Menu $menu): Response
    {
        if (!$user->isManager()) {
            return Response::deny('Hanya manager yang bisa menghapus menu.');
        }

        // Cek apakah menu sedang digunakan di order aktif
        $activeOrdersCount = $menu->orderItems()
            ->whereHas('order', fn($q) => $q->active())
            ->count();

        if ($activeOrdersCount > 0) {
            return Response::deny(
                "Menu \"{$menu->name}\" sedang digunakan di {$activeOrdersCount} order aktif dan tidak bisa dihapus."
            );
        }

        return Response::allow();
    }

    /*
    |------------------------------------------------------------------
    | TOGGLE AVAILABILITY — Manager bisa ubah ketersediaan menu
    |------------------------------------------------------------------
    */
    public function toggleAvailability(User $user, Menu $menu): bool
    {
        return $user->isManager() || $user->isKasir();
    }
}
