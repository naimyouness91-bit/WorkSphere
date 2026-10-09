<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class ManagerDashboardController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'message' => 'Manager dashboard data',
            'team' => User::where('role', 'employee')
                ->select('id', 'name', 'email', 'role')
                ->latest()
                ->limit(10)
                ->get(),
        ]);
    }
}
