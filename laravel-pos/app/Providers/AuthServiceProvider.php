<?php
// app/Providers/AuthServiceProvider.php

namespace App\Providers;

use App\Models\Delivery;
use App\Models\Menu;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Review;
use App\Models\User;
use App\Policies\DeliveryPolicy;
use App\Policies\MenuPolicy;
use App\Policies\OrderPolicy;
use App\Policies\PaymentPolicy;
use App\Policies\ReviewPolicy;
use App\Policies\UserPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * Model → Policy mapping
     */
    protected $policies = [
        Order::class    => OrderPolicy::class,
        Payment::class  => PaymentPolicy::class,
        Delivery::class => DeliveryPolicy::class,
        Menu::class     => MenuPolicy::class,
        User::class     => UserPolicy::class,
        Review::class   => ReviewPolicy::class,
    ];

    public function boot(): void
    {
        $this->registerPolicies();

        /*
        |--------------------------------------------------------------
        | GATES — aksi yang tidak terikat pada satu model spesifik
        |--------------------------------------------------------------
        */

        // Lihat laporan hanya manager
        Gate::define('view-reports', function (User $user) {
            return $user->isManager();
        });

        // Assign kurir ke delivery
        Gate::define('assign-courier', function (User $user) {
            return $user->isManager();
        });

        // Akses activity logs
        Gate::define('view-activity-logs', function (User $user) {
            return $user->isManager();
        });

        // Print receipt
        Gate::define('print-receipt', function (User $user) {
            return $user->isManager() || $user->isKasir();
        });

        // Manager super gate — bypass semua policy
        Gate::before(function (User $user, string $ability) {
            // Manager bisa melakukan semua aksi,
            // tapi tetap harus melewati validasi business logic
            // (status transition, dll) — tidak di-bypass di sini
            if ($user->isManager()) {
                return true;
            }
        });
    }
}
