<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmployeeDashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user('api');

        return response()->json([
            'message' => 'Employee dashboard data',
            'tasks' => [
                [
                    'id' => 1,
                    'title' => 'Complete onboarding',
                    'assignee' => $user->name,
                    'status' => 'in_progress',
                ],
                [
                    'id' => 2,
                    'title' => 'Review team handbook',
                    'assignee' => $user->name,
                    'status' => 'pending',
                ],
            ],
        ]);
    }
}
