<?php

namespace App\Http\Controllers\Api;

use App\Enums\ExpenseStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Expense\StoreExpenseRequest;
use App\Http\Requests\Expense\UpdateExpenseRequest;
use App\Http\Resources\ExpenseResource;
use App\Models\Expense;
use App\Models\User;
use App\Services\AccountingService;
use App\Services\FinanceService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ExpenseController extends Controller
{
    public function __construct(
        private FinanceService $financeService,
        private AccountingService $accounting,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        /** @var User $user */
        $user = $request->user('api');

        $query = Expense::query()
            ->with(['employee', 'approver'])
            ->latest('date');

        if ($this->isEmployeeOnly($user)) {
            $query->where('employee_id', $user->id);
        }

        $this->applyFilters($query, $request);

        return ExpenseResource::collection($query->get());
    }

    public function store(StoreExpenseRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        $expense = Expense::create([
            ...$request->validated(),
            'employee_id' => $user->id,
            'department' => $this->financeService->resolveDepartmentForUser($user),
            'status' => ExpenseStatus::Pending,
        ]);

        $expense->load(['employee', 'approver']);

        return response()->json([
            'message' => __('messages.expenses.submitted'),
            'data' => new ExpenseResource($expense),
        ], 201);
    }

    public function show(Expense $expense): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        if (! $this->canView($user, $expense)) {
            return response()->json(['message' => __('messages.expenses.forbidden')], 403);
        }

        $expense->load(['employee', 'approver']);

        return response()->json(['data' => new ExpenseResource($expense)]);
    }

    public function update(UpdateExpenseRequest $request, Expense $expense): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        if (! $this->canManage($user)) {
            return response()->json(['message' => __('messages.expenses.forbidden')], 403);
        }

        if ($request->has('status')) {
            if ($expense->status !== ExpenseStatus::Pending) {
                return response()->json(['message' => __('messages.expenses.not_pending')], 422);
            }

            $expense->status = $request->validated('status');
            $expense->approver_id = $user->id;
            $expense->save();

            $this->financeService->syncAllBudgetsForDepartment($expense->department);

            if ($expense->status === ExpenseStatus::Approved) {
                $this->accounting->recordExpenseTransaction($user, $expense);
            }

            $message = $expense->status === ExpenseStatus::Approved
                ? __('messages.expenses.approved')
                : __('messages.expenses.rejected');

            $expense->load(['employee', 'approver']);

            return response()->json([
                'message' => $message,
                'data' => new ExpenseResource($expense),
            ]);
        }

        $expense->fill($request->validated());
        $expense->save();
        $this->financeService->syncAllBudgetsForDepartment($expense->department);

        $expense->load(['employee', 'approver']);

        return response()->json([
            'message' => __('messages.expenses.updated'),
            'data' => new ExpenseResource($expense),
        ]);
    }

    public function destroy(Expense $expense): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        if (! $this->canManage($user)) {
            return response()->json(['message' => __('messages.expenses.forbidden')], 403);
        }

        $department = $expense->department;
        $expense->delete();
        $this->financeService->syncAllBudgetsForDepartment($department);

        return response()->json(['message' => __('messages.expenses.deleted')]);
    }

    private function applyFilters(Builder $query, Request $request): void
    {
        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('category')) {
            $query->where('category', $request->string('category'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('date', '>=', $request->string('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('date', '<=', $request->string('date_to'));
        }
    }

    private function isEmployeeOnly(User $user): bool
    {
        return $user->role === UserRole::Employee;
    }

    private function canManage(User $user): bool
    {
        return $user->hasAnyRole([
            UserRole::Admin->value,
            UserRole::Manager->value,
        ]);
    }

    private function canView(User $user, Expense $expense): bool
    {
        if ($this->canManage($user)) {
            return true;
        }

        return $expense->isOwnedBy($user);
    }
}
