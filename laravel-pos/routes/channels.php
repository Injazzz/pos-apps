<?php

use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| ROLE-BASED CHANNELS
| Semua user dengan role tertentu subscribe ke channel ini
|--------------------------------------------------------------------------
*/

// Channel untuk semua manager
Broadcast::channel('role.manager', function (User $user) {
    return $user->isManager();
});

// Channel untuk semua kasir
Broadcast::channel('role.kasir', function (User $user) {
    return $user->isKasir() || $user->isManager();
});

// Channel untuk semua kurir
Broadcast::channel('role.kurir', function (User $user) {
    return $user->isKurir() || $user->isManager();
});

/*
|--------------------------------------------------------------------------
| USER-SPECIFIC CHANNELS
| Hanya user tertentu yang boleh subscribe
|--------------------------------------------------------------------------
*/

// Channel private per customer
Broadcast::channel('customer.{userId}', function (User $user, int $userId) {
    return (int) $user->id === $userId;
});

// Channel private per kurir
Broadcast::channel('courier.{courierId}', function (User $user, int $courierId) {
    return (int) $user->id === $courierId || $user->isManager();
});

/*
|--------------------------------------------------------------------------
| ORDER-SPECIFIC CHANNEL
| Untuk tracking order secara realtime
|--------------------------------------------------------------------------
*/

Broadcast::channel('order.{orderId}', function (User $user, int $orderId) {
    $order = Order::find($orderId);

    if (!$order) return false;

    // Manager & kasir boleh subscribe semua order
    if ($user->isManager() || $user->isKasir()) return true;

    // Kurir boleh subscribe order yang ada delivery-nya ke dia
    if ($user->isKurir()) {
        return $order->delivery?->courier_id === $user->id;
    }

    // Pelanggan hanya boleh subscribe order miliknya
    if ($user->isPelanggan()) {
        return $order->customer?->user_id === $user->id;
    }

    return false;
});

/*
|--------------------------------------------------------------------------
| PRESENCE CHANNEL — Dashboard kasir (lihat siapa yang online)
|--------------------------------------------------------------------------
*/

Broadcast::channel('presence.dashboard', function (User $user) {
    if ($user->isManager() || $user->isKasir()) {
        return [
            'id'   => $user->id,
            'name' => $user->name,
            'role' => $user->role->value ?? $user->role,
        ];
    }
    return false;
});
