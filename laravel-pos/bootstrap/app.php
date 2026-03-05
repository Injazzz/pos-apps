<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
        apiPrefix: 'api',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // API menggunakan Bearer token (stateless), tidak perlu statefulApi()
        // statefulApi() menambahkan CSRF middleware yang tidak diperlukan untuk token auth

        // alias midleware custom
        $middleware->alias([
            'role' => \App\Http\Middleware\RoleMiddleware::class,
            'role.any' => \App\Http\Middleware\AnyRoleMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Handle unauthenticated json response
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, $request) {
            if($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated. Please login first.',
                ], 401);
            }
        });

        // Handle authorization JSON response
        $exceptions->render(function(\Illuminate\Auth\Access\AuthorizationException $e, $request) {
            if ($request->expectsJson()){
                return response()->json([
                    'success' => false,
                    'message' => 'You are not authorized to perform this action.',
                ], 403);
            }
        });

        // Handle validation JSON response
        $exceptions->render(function(\Illuminate\Validation\ValidationException $e, $request) {
            if ($request->expectsJson()){
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $e->errors(),
                ], 422);
            }
        });

        // Handle model not found JSON response
        $exceptions->render(function(\Illuminate\Database\Eloquent\ModelNotFoundException $e, $request) {
            if($request->expectsJson()){
                return response()->json([
                    'success' => false,
                    'message' => 'Resource not Found.',
                ], 404);
            }
        });
    })
    ->withProviders([
        \App\Providers\AuthServiceProvider::class,
    ])->create();
