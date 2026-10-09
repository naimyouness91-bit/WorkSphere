<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AdminDashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminDashboardController extends Controller
{
    public function __construct(private AdminDashboardService $dashboard) {}

    public function overview(Request $request): JsonResponse
    {
        $period = $request->query('engagement_period', 'week');
        if (! in_array($period, ['day', 'week'], true)) {
            $period = 'week';
        }

        return response()->json([
            'data' => $this->dashboard->getOverview($period),
        ]);
    }

    public function requests(Request $request): JsonResponse
    {
        $filters = $request->only(['search', 'status', 'type', 'date_from', 'date_to']);

        return response()->json([
            'data' => $this->dashboard->getFilteredRequests($filters),
        ]);
    }
}
