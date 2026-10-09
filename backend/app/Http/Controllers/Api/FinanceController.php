<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\FinanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FinanceController extends Controller
{
    public function __construct(
        private FinanceService $financeService,
    ) {}

    public function summary(Request $request): JsonResponse
    {
        return response()->json([
            'data' => [
                'kpis' => $this->financeService->dashboardKpis(),
                'expenses_by_category' => $this->financeService->expensesByCategory(),
                'budget_usage_by_department' => $this->financeService->budgetUsageByDepartment(),
            ],
        ]);
    }

    public function report(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        if (! $user->hasAnyRole([UserRole::Admin->value, UserRole::Manager->value])) {
            return response()->json(['message' => __('messages.finance.forbidden')], 403);
        }

        $year = $request->integer('year') ?: (int) now()->year;

        return response()->json([
            'data' => $this->financeService->financialReport($year),
        ]);
    }
}
