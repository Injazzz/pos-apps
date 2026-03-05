<?php

namespace App\Services;

use App\Enums\DeliveryStatus;
use App\Enums\OrderStatus;
use App\Models\Delivery;
use App\Models\Order;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Validation\ValidationException;

class StatusTransitionService
{
    // =========================================================
    // ORDER STATUS TRANSITION
    // =========================================================

    /**
     * Validasi dan eksekusi perubahan status order.
     * Dipanggil dari OrderService.
     */
    public function transitionOrderStatus(
        Order  $order,
        string $newStatusValue,
        User   $actor,
        string $reason = null
    ): Order {
        // 1. Parse enum
        try {
            $newStatus = OrderStatus::from($newStatusValue);
        } catch (\ValueError) {
            throw ValidationException::withMessages([
                'status' => ["Status '{$newStatusValue}' tidak valid."],
            ]);
        }

        $currentStatus = $order->status instanceof OrderStatus
            ? $order->status
            : OrderStatus::from($order->status);

        // 2. Cek alur status valid
        if (!$currentStatus->canTransitionTo($newStatus)) {
            throw ValidationException::withMessages([
                'status' => [
                    "Tidak bisa mengubah status dari \"{$currentStatus->label()}\" ke \"{$newStatus->label()}\".",
                ],
            ]);
        }

        // 3. Cek role permission
        $this->assertRoleCanSetStatus($actor, $newStatus, $order);

        // 4. Cek business rules tambahan
        $this->assertBusinessRules($order, $newStatus, $actor);

        // 5. Eksekusi update
        $order->update([
            'status' => $newStatus->value,
        ]);

        return $order->fresh(['items', 'payment', 'delivery', 'customer']);
    }

    // =========================================================
    // DELIVERY STATUS TRANSITION
    // =========================================================

    public function transitionDeliveryStatus(
        Delivery $delivery,
        string   $newStatusValue,
        User     $actor
    ): Delivery {
        try {
            $newStatus = DeliveryStatus::from($newStatusValue);
        } catch (\ValueError) {
            throw ValidationException::withMessages([
                'delivery_status' => ["Status '{$newStatusValue}' tidak valid."],
            ]);
        }

        // Kurir hanya bisa update delivery miliknya
        if ($actor->isKurir() && $delivery->courier_id !== $actor->id) {
            throw new AuthorizationException(
                'Delivery ini tidak di-assign ke Anda.'
            );
        }

        // Validasi transisi delivery status
        $this->assertDeliveryTransition($delivery, $newStatus, $actor);

        $updateData = ['delivery_status' => $newStatus->value];

        // Jika delivered, catat waktu
        if ($newStatus->value === DeliveryStatus::DELIVERED->value) {
            $updateData['delivered_at'] = now();

            // Update order status ke delivered juga
            $delivery->order?->update([
                'status' => OrderStatus::DELIVERED->value,
            ]);
        }

        $delivery->update($updateData);

        return $delivery->fresh(['order', 'courier']);
    }

    // =========================================================
    // PRIVATE HELPERS
    // =========================================================

    /**
     * Mapping role → status yang boleh mereka set
     */
    private function assertRoleCanSetStatus(
        User        $user,
        OrderStatus $newStatus,
        Order       $order
    ): void {
        if ($user->isManager()) return; // manager bypass

        $allowed = match (true) {
            $user->isKasir() => [
                OrderStatus::PROCESSING->value,
                OrderStatus::CANCELLED->value,
            ],
            $user->isKurir() => [
                OrderStatus::ON_DELIVERY->value,
                OrderStatus::DELIVERED->value,
            ],
            $user->isPelanggan() => [
                OrderStatus::CANCELLED->value,
                OrderStatus::COMPLETED->value,
            ],
            default => [],
        };

        if (!in_array($newStatus->value, $allowed)) {
            throw new AuthorizationException(
                "Role Anda ({$user->role_label}) tidak diizinkan mengubah status ke \"{$newStatus->label()}\"."
            );
        }
    }

    /**
     * Business rules tambahan per transisi status
     */
    private function assertBusinessRules(
        Order       $order,
        OrderStatus $newStatus,
        User        $actor
    ): void {
        // Rule 1: Tidak bisa processing kalau belum ada payment
        if ($newStatus->value === OrderStatus::PROCESSING->value) {
            // Skip jika order tipe walk-in/kasir (bisa bayar nanti)
            // Tapi jika order dari app, payment harus ada
            if ($order->source === 'app' && !$order->payment) {
                throw ValidationException::withMessages([
                    'status' => ['Order belum memiliki data pembayaran.'],
                ]);
            }
        }

        // Rule 2: Tidak bisa on_delivery kalau belum ada kurir assigned
        if ($newStatus->value === OrderStatus::ON_DELIVERY->value) {
            $orderType = $order->order_type->value ?? $order->order_type;
            if ($orderType === 'delivery' && !$order->delivery?->courier_id) {
                throw ValidationException::withMessages([
                    'status' => ['Kurir belum di-assign untuk order ini.'],
                ]);
            }
        }

        // Rule 3: Cancel harus ada reason
        if ($newStatus->value === OrderStatus::CANCELLED->value) {
            if (!request()->input('reason')) {
                throw ValidationException::withMessages([
                    'reason' => ['Alasan pembatalan wajib diisi.'],
                ]);
            }
        }

        // Rule 4: Completed hanya setelah delivered (untuk delivery)
        if ($newStatus->value === OrderStatus::COMPLETED->value) {
            $orderType     = $order->order_type->value ?? $order->order_type;
            $currentStatus = $order->status->value ?? $order->status;

            if ($orderType === 'delivery'
                && $currentStatus !== OrderStatus::DELIVERED->value
                && !$actor->isManager()
            ) {
                throw ValidationException::withMessages([
                    'status' => ['Order delivery harus sudah diantar sebelum bisa diselesaikan.'],
                ]);
            }
        }
    }

    private function assertDeliveryTransition(
        Delivery       $delivery,
        DeliveryStatus $newStatus,
        User           $actor
    ): void {
        $currentStatus = $delivery->delivery_status->value
            ?? $delivery->delivery_status;

        // Tidak bisa kembali ke status sebelumnya
        $flow = [
            DeliveryStatus::WAITING->value    => 0,
            DeliveryStatus::ASSIGNED->value   => 1,
            DeliveryStatus::PICKED_UP->value  => 2,
            DeliveryStatus::ON_THE_WAY->value => 3,
            DeliveryStatus::DELIVERED->value  => 4,
            DeliveryStatus::FAILED->value     => 4, // terminal
        ];

        $currentOrder = $flow[$currentStatus] ?? 0;
        $newOrder     = $flow[$newStatus->value] ?? 0;

        if ($newOrder < $currentOrder && !$actor->isManager()) {
            throw ValidationException::withMessages([
                'delivery_status' => [
                    "Tidak bisa mengubah status delivery dari \"{$delivery->status_label}\" ke \"{$newStatus->label()}\".",
                ],
            ]);
        }

        // Upload proof wajib saat DELIVERED
        if ($newStatus->value === DeliveryStatus::DELIVERED->value) {
            if (!$delivery->proof_photo && !request()->hasFile('proof_photo')) {
                throw ValidationException::withMessages([
                    'proof_photo' => ['Foto bukti pengiriman wajib diupload saat menandai pesanan terkirim.'],
                ]);
            }
        }
    }
}
