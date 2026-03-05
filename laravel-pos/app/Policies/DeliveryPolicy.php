<?php

namespace App\Policies;

use App\Enums\DeliveryStatus;
use App\Models\Delivery;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class DeliveryPolicy
{
    /*
    |------------------------------------------------------------------
    | VIEW ANY — Siapa yang bisa lihat daftar delivery
    |------------------------------------------------------------------
    */
    public function viewAny(User $user): bool
    {
        return $user->isManager()
            || $user->isKasir()
            || $user->isKurir();
    }

    /*
    |------------------------------------------------------------------
    | VIEW — Lihat detail delivery
    |------------------------------------------------------------------
    */
    public function view(User $user, Delivery $delivery): bool
    {
        if ($user->isManager() || $user->isKasir()) {
            return true;
        }

        // Kurir hanya bisa lihat delivery yang di-assign ke dia
        if ($user->isKurir()) {
            return $delivery->courier_id === $user->id;
        }

        // Pelanggan bisa lihat delivery order miliknya
        if ($user->isPelanggan()) {
            return $delivery->order?->customer?->user_id === $user->id;
        }

        return false;
    }

    /*
    |------------------------------------------------------------------
    | UPDATE STATUS — Validasi update status delivery
    |------------------------------------------------------------------
    */
    public function updateStatus(User $user, Delivery $delivery): Response
    {
        $requestedStatus = request()->input('delivery_status');

        if (!$requestedStatus) {
            return Response::deny('Status delivery baru wajib diisi.');
        }

        try {
            $newStatus = DeliveryStatus::from($requestedStatus);
        } catch (\ValueError) {
            return Response::deny('Status delivery tidak valid.');
        }

        // Kurir hanya bisa update delivery yang di-assign ke dia
        if ($user->isKurir()) {
            if ($delivery->courier_id !== $user->id) {
                return Response::deny('Delivery ini tidak di-assign ke Anda.');
            }

            $allowedForCourier = [
                DeliveryStatus::PICKED_UP->value,   // ambil dari toko
                DeliveryStatus::ON_THE_WAY->value,  // dalam perjalanan
                DeliveryStatus::DELIVERED->value,   // sudah diantar
                DeliveryStatus::FAILED->value,      // gagal kirim
            ];

            if (!in_array($newStatus->value, $allowedForCourier)) {
                return Response::deny(
                    "Kurir tidak diizinkan mengubah status ke \"{$newStatus->label()}\"."
                );
            }
        }

        return Response::allow();
    }

    /*
    |------------------------------------------------------------------
    | UPLOAD PROOF — Kurir upload foto bukti pengiriman
    |------------------------------------------------------------------
    */
    public function uploadProof(User $user, Delivery $delivery): Response
    {
        if (!$user->isKurir() && !$user->isManager()) {
            return Response::deny('Hanya kurir yang bisa upload bukti pengiriman.');
        }

        if ($user->isKurir() && $delivery->courier_id !== $user->id) {
            return Response::deny('Delivery ini tidak di-assign ke Anda.');
        }

        $currentStatus = $delivery->delivery_status->value
            ?? $delivery->delivery_status;

        // Harus dalam status ON_THE_WAY atau DELIVERED
        $allowedStatuses = [
            DeliveryStatus::ON_THE_WAY->value,
            DeliveryStatus::DELIVERED->value,
        ];

        if (!in_array($currentStatus, $allowedStatuses)) {
            return Response::deny(
                'Bukti pengiriman hanya bisa diupload saat status "Dalam Perjalanan" atau "Terkirim".'
            );
        }

        return Response::allow();
    }
}
