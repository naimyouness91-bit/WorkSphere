<?php

namespace App\Http\Controllers\Api;

use App\Enums\InvoiceStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Accounting\StoreInvoiceRequest;
use App\Http\Requests\Accounting\UpdateInvoiceStatusRequest;
use App\Http\Requests\Expense\StoreExpenseRequest;
use App\Http\Resources\BudgetResource;
use App\Http\Resources\ExpenseResource;
use App\Http\Resources\FinancialTransactionResource;
use App\Http\Resources\InvoiceResource;
use App\Models\Budget;
use App\Models\Expense;
use App\Models\FinancialTransaction;
use App\Models\FinanceAuditLog;
use App\Models\FinanceHistory;
use App\Models\Invoice;
use App\Models\User;
use App\Services\AccountingService;
use App\Services\FinanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AccountingController extends Controller
{
    public function __construct(
        private AccountingService $accounting,
        private FinanceService $finance,
    ) {}

    public function overview(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        return response()->json(['data' => $this->accounting->overview($user)]);
    }

    public function getBudgets(Request $request): AnonymousResourceCollection|JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        if (! $this->accounting->canManage($user)) {
            return response()->json(['message' => __('messages.accounting.forbidden')], 403);
        }

        $query = Budget::query()->orderBy('department')->orderByDesc('period_year');

        if ($request->filled('department')) {
            $query->where('department', $request->string('department'));
        }

        if ($request->filled('fiscal_year')) {
            $query->where('period_year', $request->integer('fiscal_year'));
        }

        if ($request->filled('period')) {
            $query->where('period', $request->string('period'));
        }

        $budgets = $query->get();
        $budgets->each(fn (Budget $b) => $this->finance->syncBudgetSpent($b));

        return BudgetResource::collection($budgets->fresh());
    }

    public function addExpense(StoreExpenseRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        $expense = $this->accounting->addExpense($user, $request->validated());

        return response()->json([
            'message' => __('messages.expenses.submitted'),
            'data' => new ExpenseResource($expense),
        ], 201);
    }

    public function getInvoices(Request $request): AnonymousResourceCollection|JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        if (! $this->accounting->canManage($user)) {
            return response()->json(['message' => __('messages.accounting.forbidden')], 403);
        }

        $query = Invoice::query()
            ->with(['client:id,name,company', 'creator:id,name'])
            ->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return InvoiceResource::collection($query->get());
    }

    public function createInvoice(StoreInvoiceRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        if (! $this->accounting->canManage($user)) {
            return response()->json(['message' => __('messages.accounting.forbidden')], 403);
        }

        $invoice = $this->accounting->createInvoice($user, $request->validated());

        return response()->json([
            'message' => __('messages.accounting.invoice_created'),
            'data' => new InvoiceResource($invoice),
        ], 201);
    }

    public function updateInvoiceStatus(UpdateInvoiceStatusRequest $request, Invoice $invoice): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        if (! $this->accounting->canManage($user)) {
            return response()->json(['message' => __('messages.accounting.forbidden')], 403);
        }

        $invoice = $this->accounting->updateInvoiceStatus(
            $user,
            $invoice,
            InvoiceStatus::from($request->validated('status')),
        );

        return response()->json([
            'message' => __('messages.accounting.invoice_updated'),
            'data' => new InvoiceResource($invoice),
        ]);
    }

    public function getTransactions(Request $request): AnonymousResourceCollection|JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        if (! $this->accounting->canManage($user)) {
            return response()->json(['message' => __('messages.accounting.forbidden')], 403);
        }

        $query = FinancialTransaction::query()
            ->with('creator:id,name')
            ->orderByDesc('transaction_date')
            ->orderByDesc('id');

        if ($request->filled('type')) {
            $query->where('type', $request->string('type'));
        }

        return FinancialTransactionResource::collection($query->limit(200)->get());
    }

    public function export(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        if (! $this->accounting->canManage($user)) {
            return response()->json(['message' => __('messages.accounting.forbidden')], 403);
        }

        return response()->json([
            'data' => $this->accounting->exportFinancialData($request->string('type')->toString() ?: null),
        ]);
    }

    public function auditLogs(): JsonResponse
    {
        $logs = FinanceAuditLog::query()->with('user:id,name')->orderByDesc('occurred_at')->limit(100)->get();

        return response()->json(['data' => $logs]);
    }

    public function history(): JsonResponse
    {
        $rows = FinanceHistory::query()->with('user:id,name')->orderByDesc('occurred_at')->limit(100)->get();

        return response()->json(['data' => $rows]);
    }
}
