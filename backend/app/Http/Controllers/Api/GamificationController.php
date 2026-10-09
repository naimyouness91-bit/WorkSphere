<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\GamificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GamificationController extends Controller
{
    public function __construct(
        private GamificationService $gamification,
    ) {}

    public function badges(Request $request): JsonResponse
    {
        $user = $request->user('api');

        return response()->json([
            'data' => $this->gamification->getBadgesForUser($user),
        ]);
    }

    public function points(Request $request): JsonResponse
    {
        $user = $request->user('api');

        return response()->json([
            'data' => $this->gamification->getPointsForUser($user),
        ]);
    }

    public function leaderboard(Request $request): JsonResponse
    {
        $user = $request->user('api');
        $scope = $request->query('scope', 'company');
        if (! in_array($scope, ['company', 'department'], true)) {
            $scope = 'company';
        }

        return response()->json([
            'data' => $this->gamification->getLeaderboard($user, $scope),
        ]);
    }

    public function overview(Request $request): JsonResponse
    {
        $user = $request->user('api');

        return response()->json([
            'data' => $this->gamification->getOverview($user),
        ]);
    }
}
