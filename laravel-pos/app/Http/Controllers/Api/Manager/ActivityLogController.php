<?php

namespace App\Http\Controllers\Api\Manager;

use App\Http\Controllers\Api\BaseApiController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Activitylog\Models\Activity;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class ActivityLogController extends BaseApiController
{
    use AuthorizesRequests;

    public function index(Request $request): JsonResponse
    {
        $this->authorize('view-activity-logs');

        $logs = Activity::with('causer')
            ->when($request->log_name, fn($q, $v) => $q->inLog($v))
            ->when($request->causer_id, fn($q, $v) =>
                $q->causedBy(\App\Models\User::find($v))
            )
            ->when($request->date, fn($q, $v) =>
                $q->whereDate('created_at', $v)
            )
            ->orderByDesc('created_at')
            ->paginate($request->per_page ?? 20);

        return $this->successResponse(
            $logs,
            'Activity logs berhasil diambil.'
        );
    }
}
