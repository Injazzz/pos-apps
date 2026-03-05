<?php

namespace App\Providers;

use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use App\Observers\OrderObserver;
use App\Observers\PaymentObserver;
use App\Observers\UserObserver;
use Illuminate\Support\ServiceProvider;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(\App\Services\AuthService::class);
        $this->app->singleton(\App\Services\StatusTransitionService::class);
        $this->app->singleton(\App\Services\MidtransService::class);
        $this->app->singleton(\App\Services\MenuService::class);
        $this->app->singleton(\App\Services\UserService::class);
        $this->app->singleton(\App\Services\ReportService::class);
        $this->app->singleton(\App\Services\ReceiptService::class);

        // OrderService butuh StatusTransitionService
        $this->app->singleton(\App\Services\OrderService::class, function ($app) {
            return new \App\Services\OrderService(
                $app->make(\App\Services\StatusTransitionService::class)
            );
        });

        // PaymentService butuh MidtransService
        $this->app->singleton(\App\Services\PaymentService::class, function ($app) {
            return new \App\Services\PaymentService(
                $app->make(\App\Services\MidtransService::class)
            );
        });

        // DeliveryService butuh StatusTransitionService
        $this->app->singleton(\App\Services\DeliveryService::class, function ($app) {
            return new \App\Services\DeliveryService(
                $app->make(\App\Services\StatusTransitionService::class)
            );
        });
    }

    /**
     * Bootstrap any application services.
     */
     public function boot(): void
    {
        // ── Register Observers ──────────────────────────────
        Order::observe(OrderObserver::class);
        Payment::observe(PaymentObserver::class);
        User::observe(UserObserver::class);

        // ── Model best practices ────────────────────────────
        Model::shouldBeStrict(
            !app()->isProduction()
        );

        // ── Prevent N+1 di production ───────────────────────
        Model::preventLazyLoading(
            !app()->isProduction()
        );

        // ── Prevent silent discarding fillable ──────────────
        Model::preventSilentlyDiscardingAttributes(
            !app()->isProduction()
        );

        // ── Query log di development ─────────────────────────
        if (app()->environment('local')) {
            DB::listen(function ($query) {
                if ($query->time > 1000) {
                    logger()->warning('Slow query detected', [
                        'sql'      => $query->sql,
                        'bindings' => $query->bindings,
                        'time'     => $query->time . 'ms',
                    ]);
                }
            });
        }
    }
}
