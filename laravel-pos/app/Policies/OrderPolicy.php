<?php

namespace App\Policies;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class OrderPolicy
{
    /*
    |------------------------------------------------------------------
    | VIEW ANY — Siapa yang boleh lihat daftar order
    |------------------------------------------------------------------
    */
    public function viewAny(User $user): bool
    {
        // Semua role yang login boleh lihat
        // (filter di controller berdasarkan role)
        return true;
    }

    /*
    |------------------------------------------------------------------
    | VIEW — Siapa yang boleh lihat detail satu order
    |------------------------------------------------------------------
    */
    public function view(User $user, Order $order): bool
    {
        return match (true) {
            // Manager bisa lihat semua (di-handle Gate::before)
            $user->isKasir()  => true, // kasir lihat semua order
            $user->isKurir()  => $this->courierCanViewOrder($user, $order),
            $user->isPelanggan() => $this->customerOwnsOrder($user, $order),
            default           => false,
        };
    }

    /*
    |------------------------------------------------------------------
    | CREATE — Siapa yang boleh buat order baru
    |------------------------------------------------------------------
    */
    public function create(User $user): bool
    {
        return $user->isKasir()
            || $user->isPelanggan()
            || $user->isManager();
    }

    /*
    |------------------------------------------------------------------
    | UPDATE STATUS — Validasi perubahan status per role
    |------------------------------------------------------------------
    */
    public function updateStatus(User $user, Order $order): Response
    {
        $requestedStatus = request()->input('status');

        if (!$requestedStatus) {
            return Response::deny('Status baru wajib diisi.');
        }

        try {
            $newStatus = OrderStatus::from($requestedStatus);
        } catch (\ValueError) {
            return Response::deny('Status tidak valid.');
        }

        // Cek apakah transisi status valid secara alur
        if (!$order->canTransitionTo($newStatus)) {
            $currentLabel = $order->status_label;
            $newLabel     = $newStatus->label();
            return Response::deny(
                "Tidak bisa mengubah status dari \"{$currentLabel}\" ke \"{$newLabel}\"."
            );
        }

        // Cek apakah role user boleh mengubah ke status tersebut
        $allowed = $this->getAllowedTransitionsByRole($user, $order);

        if (!in_array($newStatus->value, $allowed)) {
            return Response::deny(
                "Role Anda ({$user->role_label}) tidak diizinkan mengubah status ke \"{$newStatus->label()}\"."
            );
        }

        return Response::allow();
    }

    /*
    |------------------------------------------------------------------
    | DELETE — Hanya manager yang bisa hapus order
    |------------------------------------------------------------------
    */
    public function delete(User $user, Order $order): bool
    {
        return $user->isManager();
    }

    /*
    |------------------------------------------------------------------
    | CANCEL — Siapa yang boleh batalkan order
    |------------------------------------------------------------------
    */
    public function cancel(User $user, Order $order): Response
    {
        // Order sudah selesai atau sudah dibatalkan
        if (in_array($order->status->value ?? $order->status, [
            OrderStatus::COMPLETED->value,
            OrderStatus::CANCELLED->value,
        ])) {
            return Response::deny('Order sudah selesai atau dibatalkan.');
        }

        // Kasir hanya bisa cancel order yang masih pending/processing
        if ($user->isKasir()) {
            $cancellableStatuses = [
                OrderStatus::PENDING->value,
                OrderStatus::PROCESSING->value,
            ];
            $currentStatus = $order->status->value ?? $order->status;

            if (!in_array($currentStatus, $cancellableStatuses)) {
                return Response::deny(
                    'Kasir hanya bisa membatalkan order yang masih pending atau diproses.'
                );
            }
            return Response::allow();
        }

        // Customer hanya bisa cancel order miliknya yang masih pending
        if ($user->isPelanggan()) {
            if (!$this->customerOwnsOrder($user, $order)) {
                return Response::deny('Anda tidak memiliki akses ke order ini.');
            }
            $currentStatus = $order->status->value ?? $order->status;
            if ($currentStatus !== OrderStatus::PENDING->value) {
                return Response::deny(
                    'Pelanggan hanya bisa membatalkan order yang masih pending.'
                );
            }
            return Response::allow();
        }

        return Response::deny('Anda tidak diizinkan membatalkan order ini.');
    }

    /*
    |------------------------------------------------------------------
    | COMPLETE — Customer konfirmasi pesanan diterima
    |------------------------------------------------------------------
    */
    public function complete(User $user, Order $order): Response
    {
        if (!$user->isPelanggan()) {
            return Response::deny('Hanya pelanggan yang bisa konfirmasi pesanan diterima.');
        }

        if (!$this->customerOwnsOrder($user, $order)) {
            return Response::deny('Anda tidak memiliki akses ke order ini.');
        }

        $currentStatus = $order->status->value ?? $order->status;
        $allowedToComplete = [
            OrderStatus::DELIVERED->value,
            OrderStatus::READY->value, // untuk take_away
        ];

        if (!in_array($currentStatus, $allowedToComplete)) {
            return Response::deny(
                'Pesanan belum bisa dikonfirmasi. Status saat ini: ' . $order->status_label
            );
        }

        return Response::allow();
    }

    /*
    |------------------------------------------------------------------
    | ASSIGN COURIER — Hanya manager
    |------------------------------------------------------------------
    */
    public function assignCourier(User $user, Order $order): Response
    {
        if (!$user->isManager()) {
            return Response::deny('Hanya manager yang bisa assign kurir.');
        }

        $orderType = $order->order_type->value ?? $order->order_type;
        if ($orderType !== 'delivery') {
            return Response::deny('Hanya order bertipe delivery yang membutuhkan kurir.');
        }

        return Response::allow();
    }

    /*
    |------------------------------------------------------------------
    | PRIVATE HELPERS
    |------------------------------------------------------------------
    */

    private function customerOwnsOrder(User $user, Order $order): bool
    {
        return $order->customer_id !== null
            && $order->customer?->user_id === $user->id;
    }

    private function courierCanViewOrder(User $user, Order $order): bool
    {
        // Kurir hanya bisa lihat order yang ada delivery-nya
        // dan delivery di-assign ke dia
        return $order->delivery?->courier_id === $user->id;
    }

    /**
     * Mapping: role → status apa saja yang boleh dia set
     */
    private function getAllowedTransitionsByRole(User $user, Order $order): array
    {
        return match (true) {
            $user->isManager() => OrderStatus::values(), // semua

            $user->isKasir() => [
                OrderStatus::PROCESSING->value,  // konfirmasi order
                OrderStatus::CANCELLED->value,   // batalkan
            ],

            $user->isKurir() => [
                OrderStatus::ON_DELIVERY->value, // mulai antar
                OrderStatus::DELIVERED->value,   // sudah diterima
            ],

            $user->isPelanggan() => [
                OrderStatus::COMPLETED->value,   // konfirmasi terima
                OrderStatus::CANCELLED->value,   // batalkan (hanya pending)
            ],

            default => [],
        };
    }
}
