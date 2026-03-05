<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     * Usage: ->middleware('role:manager') atau ->middleware('role:manager,kasir')
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        if (!$request->user()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        // Get user role value (enum string value)
        $userRole = $request->user()->role?->value ?? $request->user()->role;

        if(!in_array($userRole, $roles)) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied.',
            ], 403);
        }

        return $next($request);
    }
}
