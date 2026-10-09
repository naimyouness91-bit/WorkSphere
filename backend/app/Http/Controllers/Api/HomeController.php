<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\HomeDashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HomeController extends Controller
{
    public function __construct(
        private HomeDashboardService $homeDashboard,
    ) {}

    public function overview(Request $request): JsonResponse
    {
        $user = $request->user('api');

        return response()->json([
            'data' => $this->homeDashboard->overview($user),
        ]);
    }
}
