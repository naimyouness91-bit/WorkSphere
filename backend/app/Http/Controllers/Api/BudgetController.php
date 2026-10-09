<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Budget\StoreBudgetRequest;
use App\Http\Requests\Budget\UpdateBudgetRequest;
use App\Http\Resources\BudgetResource;
use App\Models\Budget;
use App\Models\User;
use App\Services\FinanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class BudgetController extends Controller
{
    public function __construct(
        private FinanceService $financeService,
    ) {}

    public function index(Request $request): AnonymousResourceCollection|JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        if (! $this->canManage($user)) {
            return response()->json(['message' => __('messages.budgets.forbidden')], 403);
        }

        $query = Budget::query()->orderBy('department')->orderByDesc('period_year');

        if ($request->filled('department')) {
            $query->where('department', $request->string('department'));
        }

        if ($request->filled('period')) {
            $query->where('period', $request->string('period'));
        }

        $budgets = $query->get();
        $budgets->each(fn (Budget $b) => $this->financeService->syncBudgetSpent($b));

        return BudgetResource::collection($budgets->fresh());
    }

    public function store(StoreBudgetRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        if (! $this->canManage($user)) {
            return response()->json(['message' => __('messages.budgets.forbidden')], 403);
        }

        $validated = $request->validated();

        if (($validated['period'] ?? null) === 'yearly') {
            $validated['period_month'] = null;
        }

        $budget = Budget::create([
            ...$validated,
            'spent_amount' => 0,
            'created_by' => $user->id,
        ]);

        $this->financeService->syncBudgetSpent($budget);

        return response()->json([
            'message' => __('messages.budgets.created'),
            'data' => new BudgetResource($budget->fresh()),
        ], 201);
    }

    public function show(Budget $budget): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        if (! $this->canManage($user)) {
            return response()->json(['message' => __('messages.budgets.forbidden')], 403);
        }

        $this->financeService->syncBudgetSpent($budget);

        return response()->json(['data' => new BudgetResource($budget->fresh())]);
    }

    public function update(UpdateBudgetRequest $request, Budget $budget): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        if (! $this->canManage($user)) {
            return response()->json(['message' => __('messages.budgets.forbidden')], 403);
        }

        $budget->fill($request->validated());

        if ($budget->period?->value === 'yearly') {
            $budget->period_month = null;
        }

        $budget->save();
        $this->financeService->syncBudgetSpent($budget);

        return response()->json([
            'message' => __('messages.budgets.updated'),
            'data' => new BudgetResource($budget->fresh()),
        ]);
    }

    public function destroy(Budget $budget): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        if (! $this->canManage($user)) {
            return response()->json(['message' => __('messages.budgets.forbidden')], 403);
        }

        $budget->delete();

        return response()->json(['message' => __('messages.budgets.deleted')]);
    }

    public function departments(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        if (! $this->canManage($user)) {
            return response()->json(['message' => __('messages.budgets.forbidden')], 403);
        }

        return response()->json([
            'data' => $this->financeService->departmentOptions(),
        ]);
    }

    private function canManage(User $user): bool
    {
        return $user->hasAnyRole([
            UserRole::Admin->value,
            UserRole::Manager->value,
        ]);
    }
}
