<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Http\Resources\Json\ResourceCollection;

trait ApiResponse
{
    // ─── Success Responses ────────────────────────────────────

    protected function successResponse(
        mixed  $data    = null,
        string $message = 'Success',
        int    $code    = 200
    ): JsonResponse {
        $payload = [
            'success' => true,
            'message' => $message,
        ];

        if (!is_null($data)) {
            if ($data instanceof JsonResource || $data instanceof ResourceCollection) {
                // Resource/Collection: biarkan Laravel handle format
                return $data->additional([
                    'success' => true,
                    'message' => $message,
                ])->response()->setStatusCode($code);
            }
            $payload['data'] = $data;
        }

        return response()->json($payload, $code);
    }

    protected function createdResponse(
        mixed  $data    = null,
        string $message = 'Data berhasil dibuat'
    ): JsonResponse {
        return $this->successResponse($data, $message, 201);
    }

    protected function noContentResponse(
        string $message = 'Data berhasil dihapus'
    ): JsonResponse {
        return response()->json([
            'success' => true,
            'message' => $message,
        ], 200);
    }

    // ─── Error Responses ──────────────────────────────────────

    protected function errorResponse(
        string $message = 'Terjadi kesalahan',
        int    $code    = 400,
        mixed  $errors  = null
    ): JsonResponse {
        $payload = [
            'success' => false,
            'message' => $message,
        ];

        if (!is_null($errors)) {
            $payload['errors'] = $errors;
        }

        return response()->json($payload, $code);
    }

    protected function notFoundResponse(
        string $message = 'Data tidak ditemukan'
    ): JsonResponse {
        return $this->errorResponse($message, 404);
    }

    protected function forbiddenResponse(
        string $message = 'Akses ditolak'
    ): JsonResponse {
        return $this->errorResponse($message, 403);
    }

    protected function unauthorizedResponse(
        string $message = 'Silakan login terlebih dahulu'
    ): JsonResponse {
        return $this->errorResponse($message, 401);
    }

    protected function validationErrorResponse(
        array  $errors,
        string $message = 'Validasi gagal'
    ): JsonResponse {
        return response()->json([
            'success' => false,
            'message' => $message,
            'errors'  => $errors,
        ], 422);
    }

    // ─── Paginated Response ───────────────────────────────────

    protected function paginatedResponse(
        mixed  $paginator,
        string $message = 'Success'
    ): JsonResponse {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $paginator,
        ]);
    }
}
