<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DashboardAnalyticsService;
use Illuminate\Http\JsonResponse;

class DashboardAnalyticsController extends Controller
{
    public function __construct(private DashboardAnalyticsService $analytics) {}

    public function index(): JsonResponse
    {
        return response()->json([
            'data' => $this->analytics->getAnalytics(),
        ]);
    }
}
