<?php

namespace App\Policies;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Review;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class ReviewPolicy
{
    /*
    |------------------------------------------------------------------
    | CREATE — Pelanggan bisa buat review
    |------------------------------------------------------------------
    */
    public function create(User $user, Order $order): Response
    {
        // Hanya pelanggan
        if (!$user->isPelanggan()) {
            return Response::deny('Hanya pelanggan yang bisa memberikan ulasan.');
        }

        // Harus punya order ini
        if ($order->customer?->user_id !== $user->id) {
            return Response::deny('Anda tidak memiliki akses ke order ini.');
        }

        // Order harus sudah completed
        $status = $order->status->value ?? $order->status;
        if ($status !== OrderStatus::COMPLETED->value) {
            return Response::deny(
                'Ulasan hanya bisa diberikan setelah pesanan selesai.'
            );
        }

        // Belum pernah review order ini
        if ($order->review()->exists()) {
            return Response::deny('Anda sudah memberikan ulasan untuk pesanan ini.');
        }

        return Response::allow();
    }

    /*
    |------------------------------------------------------------------
    | UPDATE — Pelanggan bisa edit review miliknya
    |------------------------------------------------------------------
    */
    public function update(User $user, Review $review): Response
    {
        if ($review->customer?->user_id !== $user->id) {
            return Response::deny('Anda tidak bisa mengedit ulasan orang lain.');
        }

        // Review hanya bisa diedit dalam 24 jam
        if ($review->created_at->diffInHours(now()) > 24) {
            return Response::deny('Ulasan hanya bisa diedit dalam 24 jam setelah dibuat.');
        }

        return Response::allow();
    }

    /*
    |------------------------------------------------------------------
    | DELETE — Manager bisa hapus review yang tidak pantas
    |------------------------------------------------------------------
    */
    public function delete(User $user, Review $review): bool
    {
        return $user->isManager();
    }
}
