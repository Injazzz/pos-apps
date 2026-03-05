<?php

namespace App\Http\Controllers\Api\Manager;

use App\Http\Controllers\Api\BaseApiController;
use App\Services\ReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class ReportController extends BaseApiController
{
    use AuthorizesRequests;

    public function __construct(
        private readonly ReportService $reportService
    ) {}

    public function daily(Request $request): JsonResponse
    {
        $this->authorize('view-reports');

        $date   = $request->input('date', today()->toDateString());
        $report = $this->reportService->getDailyReport($date);

        return $this->successResponse($report, 'Laporan harian berhasil diambil.');
    }

    public function monthly(Request $request): JsonResponse
    {
        $this->authorize('view-reports');

        $month  = (int) $request->input('month', now()->month);
        $year   = (int) $request->input('year', now()->year);
        $report = $this->reportService->getMonthlyReport($month, $year);

        return $this->successResponse($report, 'Laporan bulanan berhasil diambil.');
    }

    public function summary(): JsonResponse
    {
        $this->authorize('view-reports');

        return $this->successResponse(
            $this->reportService->getSummary(),
            'Ringkasan berhasil diambil.'
        );
    }
}
