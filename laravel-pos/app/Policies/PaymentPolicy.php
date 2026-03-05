<?php

namespace App\Policies;

use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class PaymentPolicy
{
    /*
    |------------------------------------------------------------------
    | VIEW — Siapa yang boleh lihat detail payment
    |------------------------------------------------------------------
    */
    public function view(User $user, Payment $payment): bool
    {
        if ($user->isKasir() || $user->isManager()) {
            return true;
        }

        // Pelanggan hanya boleh lihat payment order miliknya
        if ($user->isPelanggan()) {
            return $payment->order?->customer?->user_id === $user->id;
        }

        return false;
    }

    /*
    |------------------------------------------------------------------
    | CREATE — Siapa yang boleh buat payment baru
    |------------------------------------------------------------------
    */
    public function create(User $user, Order $order): Response
    {
        // Cek apakah order sudah punya payment yang lunas
        if ($order->payment?->status?->value === PaymentStatus::PAID->value) {
            return Response::deny('Order ini sudah lunas.');
        }

        // Kasir bisa proses semua payment (cash, transfer, qris, dp)
        if ($user->isKasir()) {
            return Response::allow();
        }

        // Pelanggan hanya bisa bayar order miliknya via Midtrans
        if ($user->isPelanggan()) {
            $ownsOrder = $order->customer?->user_id === $user->id;
            if (!$ownsOrder) {
                return Response::deny('Anda tidak memiliki akses ke order ini.');
            }
            return Response::allow();
        }

        return Response::deny('Anda tidak diizinkan memproses pembayaran.');
    }

    /*
    |------------------------------------------------------------------
    | PROCESS CASH — Hanya kasir dan manager
    |------------------------------------------------------------------
    */
    public function processCash(User $user): bool
    {
        return $user->isKasir() || $user->isManager();
    }

    /*
    |------------------------------------------------------------------
    | PROCESS MIDTRANS — Kasir, manager, pelanggan
    |------------------------------------------------------------------
    */
    public function processMidtrans(User $user): bool
    {
        return true; // semua yang login boleh
    }

    /*
    |------------------------------------------------------------------
    | REFUND — Hanya manager
    |------------------------------------------------------------------
    */
    public function refund(User $user, Payment $payment): Response
    {
        if (!$user->isManager()) {
            return Response::deny('Hanya manager yang bisa melakukan refund.');
        }

        $status = $payment->status?->value ?? $payment->status;
        if ($status !== PaymentStatus::PAID->value) {
            return Response::deny('Hanya payment yang sudah lunas yang bisa di-refund.');
        }

        return Response::allow();
    }

    /*
    |------------------------------------------------------------------
    | UPLOAD PROOF — Kasir bisa upload bukti transfer
    |------------------------------------------------------------------
    */
    public function uploadProof(User $user, Payment $payment): bool
    {
        return $user->isKasir() || $user->isManager();
    }
}
