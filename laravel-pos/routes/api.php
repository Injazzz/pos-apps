<?php

use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    // Public
    Route::post('register',        [\App\Http\Controllers\Api\Auth\RegisterController::class, 'register']);
    Route::post('login',           [\App\Http\Controllers\Api\Auth\LoginController::class, 'login']);
    Route::get('google',           [\App\Http\Controllers\Api\Auth\SocialiteController::class, 'redirectToGoogle']);
    Route::get('google/callback',  [\App\Http\Controllers\Api\Auth\SocialiteController::class, 'handleGoogleCallback']);

    // Protected
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout',          [\App\Http\Controllers\Api\Auth\LoginController::class, 'logout']);
        Route::post('logout-all',      [\App\Http\Controllers\Api\Auth\LoginController::class, 'logoutAll']);
        Route::get('me',               [\App\Http\Controllers\Api\Auth\LoginController::class, 'me']);
        Route::put('profile',          [\App\Http\Controllers\Api\Auth\LoginController::class, 'updateProfile']);
    });
});

// Menu publik (bisa dilihat tanpa login - untuk preview)
Route::get('menus', [\App\Http\Controllers\Api\Shared\MenuController::class, 'index']);
Route::get('menus/{menu}', [\App\Http\Controllers\Api\Shared\MenuController::class, 'show']);

/*
|--------------------------------------------------------------------------
| PROTECTED ROUTES (auth required)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum'])->group(function () {

    // Auth
    Route::post('auth/logout', [\App\Http\Controllers\Api\Auth\LoginController::class, 'logout']);
    Route::get('auth/me',      [\App\Http\Controllers\Api\Auth\LoginController::class, 'me']);

    /*
    |----------------------------------------------------------------------
    | MANAGER ROUTES
    |----------------------------------------------------------------------
    */
    Route::prefix('manager')->middleware('role:manager')->group(function () {
        // Users CRUD
        Route::apiResource('users', \App\Http\Controllers\Api\Manager\UserController::class);
        Route::patch('users/{user}/toggle-status', [\App\Http\Controllers\Api\Manager\UserController::class, 'toggleStatus']);

        // Menu CRUD
        Route::apiResource('menus', \App\Http\Controllers\Api\Manager\MenuController::class);
        Route::patch('menus/{menu}/toggle-availability', [\App\Http\Controllers\Api\Manager\MenuController::class, 'toggleAvailability']);

        // Orders - monitoring
        Route::get('orders',          [\App\Http\Controllers\Api\Manager\OrderController::class, 'index']);
        Route::get('orders/{order}',  [\App\Http\Controllers\Api\Manager\OrderController::class, 'show']);
        Route::patch('orders/{order}/status', [\App\Http\Controllers\Api\Manager\OrderController::class, 'updateStatus']);

        // Assign kurir
        Route::post('orders/{order}/assign-courier', [\App\Http\Controllers\Api\Manager\OrderController::class, 'assignCourier']);

        // Reports
        Route::get('reports/daily',   [\App\Http\Controllers\Api\Manager\ReportController::class, 'daily']);
        Route::get('reports/monthly', [\App\Http\Controllers\Api\Manager\ReportController::class, 'monthly']);
        Route::get('reports/summary', [\App\Http\Controllers\Api\Manager\ReportController::class, 'summary']);
        Route::get('reports/export',  [\App\Http\Controllers\Api\Manager\ReportController::class, 'export']);

        // Activity Logs
        Route::get('activity-logs',   [\App\Http\Controllers\Api\Manager\ActivityLogController::class, 'index']);
    });

    /*
    |----------------------------------------------------------------------
    | KASIR ROUTES
    |----------------------------------------------------------------------
    */
    Route::prefix('cashier')->middleware('role:kasir,manager')->group(function () {
        // Orders
        Route::get('orders',                           [\App\Http\Controllers\Api\Cashier\OrderController::class, 'index']);
        Route::post('orders',                          [\App\Http\Controllers\Api\Cashier\OrderController::class, 'store']);
        Route::get('orders/{order}',                   [\App\Http\Controllers\Api\Cashier\OrderController::class, 'show']);
        Route::patch('orders/{order}/status',          [\App\Http\Controllers\Api\Cashier\OrderController::class, 'updateStatus']);

        // Payments
        Route::post('orders/{order}/payments',         [\App\Http\Controllers\Api\Cashier\PaymentController::class, 'store']);
        Route::get('orders/{order}/payments',          [\App\Http\Controllers\Api\Cashier\PaymentController::class, 'show']);
        Route::post('orders/{order}/payments/confirm-transfer',[\App\Http\Controllers\Api\Cashier\PaymentController::class, 'confirmTransfer']);
        // Receipt / Print
        Route::get('orders/{order}/receipt',           [\App\Http\Controllers\Api\Cashier\ReceiptController::class, 'generate']);
        Route::post('orders/{order}/receipt/print',    [\App\Http\Controllers\Api\Cashier\ReceiptController::class, 'print']);
    });

    /*
    |----------------------------------------------------------------------
    | CUSTOMER ROUTES
    |----------------------------------------------------------------------
    */
    Route::prefix('customer')->middleware('role:pelanggan,manager')->group(function () {
        // Profile
        Route::get('profile',         [\App\Http\Controllers\Api\Customer\ProfileController::class, 'show']);
        Route::put('profile',         [\App\Http\Controllers\Api\Customer\ProfileController::class, 'update']);
        Route::get('stats',           [\App\Http\Controllers\Api\Customer\ProfileController::class, 'getStats']);
        Route::get('addresses',       [\App\Http\Controllers\Api\Customer\ProfileController::class, 'getAddresses']);

        // Cart & Orders
        Route::get('cart',            [\App\Http\Controllers\Api\Customer\CartController::class, 'index']);
        Route::post('cart',           [\App\Http\Controllers\Api\Customer\CartController::class, 'store']);
        Route::put('cart/{item}',     [\App\Http\Controllers\Api\Customer\CartController::class, 'update']);
        Route::delete('cart/{item}',  [\App\Http\Controllers\Api\Customer\CartController::class, 'destroy']);

        Route::get('orders',          [\App\Http\Controllers\Api\Customer\OrderController::class, 'index']);
        Route::post('orders',         [\App\Http\Controllers\Api\Customer\OrderController::class, 'store']);
        Route::get('orders/{order}',  [\App\Http\Controllers\Api\Customer\OrderController::class, 'show']);
        Route::patch('orders/{order}/complete', [\App\Http\Controllers\Api\Customer\OrderController::class, 'markCompleted']);

        // Payment (Midtrans Snap)
        Route::post('orders/{order}/payment/snap', [\App\Http\Controllers\Api\Customer\PaymentController::class, 'createSnap']);

        // Review
        Route::post('orders/{order}/review', [\App\Http\Controllers\Api\Customer\ReviewController::class, 'store']);
    });

    /*
    |----------------------------------------------------------------------
    | KURIR ROUTES
    |----------------------------------------------------------------------
    */
    Route::prefix('courier')->middleware('role:kurir,manager')->group(function () {
        Route::get('deliveries',                              [\App\Http\Controllers\Api\Courier\DeliveryController::class, 'index']);
        Route::get('deliveries/{delivery}',                   [\App\Http\Controllers\Api\Courier\DeliveryController::class, 'show']);
        Route::patch('deliveries/{delivery}/status',          [\App\Http\Controllers\Api\Courier\DeliveryController::class, 'updateStatus']);
        Route::post('deliveries/{delivery}/proof',            [\App\Http\Controllers\Api\Courier\DeliveryController::class, 'uploadProof']);
    });

});

/*
|--------------------------------------------------------------------------
| MIDTRANS WEBHOOK (tidak perlu auth, tapi pakai signature validation)
|--------------------------------------------------------------------------
*/
Route::post('payments/midtrans/webhook', [\App\Http\Controllers\Api\Cashier\PaymentController::class, 'midtransWebhook'])
    ->name('midtrans.webhook');
