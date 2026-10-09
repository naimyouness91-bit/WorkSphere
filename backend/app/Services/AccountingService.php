<?php

namespace App\Services;

use App\Enums\BudgetStatus;
use App\Enums\ExpenseStatus;
use App\Enums\InvoiceStatus;
use App\Enums\TransactionType;
use App\Enums\UserRole;
use App\Models\Budget;
use App\Models\Expense;
use App\Models\FinanceAuditLog;
use App\Models\FinanceHistory;
use App\Models\FinancialTransaction;
use App\Models\Invoice;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AccountingService
{
    public function __construct(
        private FinanceService $finance,
        private NotificationService $notifications,
    ) {}

    public function canManage(User $user): bool
    {
        return in_array($user->role, [UserRole::Admin, UserRole::Manager], true);
    }

    public function overview(User $user): array
    {
        $this->processOverdueInvoices();

        $totalExpenses = (float) Expense::where('status', ExpenseStatus::Approved)->sum('amount');
        $pendingInvoices = Invoice::where('status', InvoiceStatus::Pending)->count();
        $overdueInvoices = Invoice::where('status', InvoiceStatus::Overdue)->count();

        $budgets = Budget::all();
        $budgets->each(fn (Budget $b) => $this->finance->syncBudgetSpent($b));
        $budgets = Budget::all();

        $totalAllocated = (float) $budgets->sum('allocated_amount');
        $totalSpent = (float) $budgets->sum('spent_amount');
        $utilization = $totalAllocated > 0 ? round(($totalSpent / $totalAllocated) * 100, 1) : 0;

        $income = (float) FinancialTransaction::where('type', TransactionType::Income)->sum('amount');
        $txExpenses = (float) FinancialTransaction::where('type', TransactionType::Expense)->sum('amount');

        return [
            'stats' => $this->statsForDashboard($user),
            'budgets' => $budgets->map(fn (Budget $b) => [
                'id' => $b->id,
                'department' => $b->department,
                'allocated_amount' => (float) $b->allocated_amount,
                'spent_amount' => (float) $b->spent_amount,
                'remaining_amount' => $b->remainingAmount(),
                'usage_percent' => $b->usagePercent(),
                'status' => $b->status->value,
                'period_year' => $b->period_year,
            ])->values()->all(),
            'expenses_by_category' => $this->finance->expensesByCategory(),
            'income_vs_expenses' => [
                'income' => round($income, 2),
                'expenses' => round($txExpenses > 0 ? $txExpenses : $totalExpenses, 2),
            ],
            'kpis' => [
                'total_expenses' => round($totalExpenses, 2),
                'pending_invoices' => $pendingInvoices,
                'overdue_invoices' => $overdueInvoices,
                'budget_utilization' => $utilization,
            ],
        ];
    }

    /**
     * @return array{total_expenses: float, pending_invoices: int, budget_utilization: float, overdue_invoices: int}|null
     */
    public function statsForDashboard(User $user): ?array
    {
        if ($user->role === UserRole::Employee) {
            return null;
        }

        $budgets = Budget::all();
        $budgets->each(fn (Budget $b) => $this->finance->syncBudgetSpent($b));
        $budgets = Budget::fresh();

        $totalAllocated = (float) $budgets->sum('allocated_amount');
        $totalSpent = (float) $budgets->sum('spent_amount');

        return [
            'total_expenses' => round((float) Expense::where('status', ExpenseStatus::Approved)->sum('amount'), 2),
            'pending_invoices' => Invoice::where('status', InvoiceStatus::Pending)->count(),
            'overdue_invoices' => Invoice::where('status', InvoiceStatus::Overdue)->count(),
            'budget_utilization' => $totalAllocated > 0 ? round(($totalSpent / $totalAllocated) * 100, 1) : 0,
        ];
    }

    public function addExpense(User $user, array $data): Expense
    {
        $expense = Expense::create([
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'amount' => $data['amount'],
            'category' => $data['category'],
            'date' => $data['date'],
            'department' => $data['department'] ?? $this->finance->resolveDepartmentForUser($user),
            'employee_id' => $user->id,
            'status' => ExpenseStatus::Pending,
        ]);

        $expense->load(['employee', 'approver']);

        $this->audit($user->id, 'expense_created', 'expense', $expense->id,
            __('messages.accounting.audit_expense_created', ['title' => $expense->title]));
        $this->history($user->id, 'expense_created', 'expense', $expense->id,
            __('messages.accounting.history_expense_created', ['title' => $expense->title, 'amount' => $expense->amount]));

        return $expense;
    }

    public function createInvoice(User $actor, array $data): Invoice
    {
        $invoice = Invoice::create([
            'invoice_number' => $this->nextInvoiceNumber(),
            'client_id' => $data['client_id'],
            'amount' => $data['amount'],
            'due_date' => $data['due_date'],
            'status' => InvoiceStatus::Pending,
            'notes' => $data['notes'] ?? null,
            'created_by' => $actor->id,
        ]);

        $invoice->load(['client:id,name,company', 'creator:id,name']);

        $this->audit($actor->id, 'invoice_created', 'invoice', $invoice->id,
            __('messages.accounting.audit_invoice_created', ['number' => $invoice->invoice_number]));
        $this->history($actor->id, 'invoice_created', 'invoice', $invoice->id,
            __('messages.accounting.history_invoice_created', ['number' => $invoice->invoice_number]));

        return $invoice;
    }

    public function updateInvoiceStatus(User $actor, Invoice $invoice, InvoiceStatus $status): Invoice
    {
        $previous = $invoice->status;
        $updates = ['status' => $status];

        if ($status === InvoiceStatus::Paid) {
            $updates['paid_at'] = now();
            $this->recordTransaction(
                $actor,
                TransactionType::Income,
                (float) $invoice->amount,
                $invoice->due_date,
                'INV-'.$invoice->invoice_number,
                'invoice',
                $invoice->id,
                __('messages.accounting.invoice_payment', ['number' => $invoice->invoice_number]),
            );
        }

        $invoice->update($updates);

        $this->audit($actor->id, 'invoice_status', 'invoice', $invoice->id,
            __('messages.accounting.audit_invoice_status', [
                'number' => $invoice->invoice_number,
                'from' => $previous->value,
                'to' => $status->value,
            ]));
        $this->history($actor->id, 'invoice_status', 'invoice', $invoice->id,
            __('messages.accounting.history_invoice_status', [
                'number' => $invoice->invoice_number,
                'status' => $status->value,
            ]));

        return $invoice->fresh()->load(['client:id,name,company', 'creator:id,name']);
    }

    public function recordExpenseTransaction(User $actor, Expense $expense): ?FinancialTransaction
    {
        if ($expense->status !== ExpenseStatus::Approved) {
            return null;
        }

        $existing = FinancialTransaction::where('reference_type', 'expense')
            ->where('reference_id', $expense->id)
            ->first();

        if ($existing) {
            return $existing;
        }

        return $this->recordTransaction(
            $actor,
            TransactionType::Expense,
            (float) $expense->amount,
            $expense->date,
            'EXP-'.$expense->id,
            'expense',
            $expense->id,
            $expense->title,
        );
    }

    public function recordTransaction(
        User $actor,
        TransactionType $type,
        float $amount,
        $date,
        string $reference,
        ?string $referenceType = null,
        ?int $referenceId = null,
        ?string $description = null,
    ): FinancialTransaction {
        $tx = FinancialTransaction::create([
            'type' => $type,
            'amount' => $amount,
            'transaction_date' => $date,
            'reference' => $reference,
            'reference_type' => $referenceType,
            'reference_id' => $referenceId,
            'description' => $description,
            'created_by' => $actor->id,
        ]);

        $this->audit($actor->id, 'transaction_recorded', 'transaction', $tx->id,
            __('messages.accounting.audit_transaction', [
                'type' => $type->value,
                'amount' => number_format($amount, 2),
            ]));

        return $tx;
    }

    public function checkBudgetAlerts(Budget $budget): void
    {
        $spent = (float) $budget->spent_amount;
        $allocated = (float) $budget->allocated_amount;

        if ($allocated <= 0) {
            return;
        }

        if ($spent > $allocated) {
            if ($budget->status !== BudgetStatus::Exceeded) {
                $budget->update(['status' => BudgetStatus::Exceeded]);
            }

            $cooldown = Carbon::now()->subHours(24);
            if (! $budget->exceeded_notified_at || $budget->exceeded_notified_at->lt($cooldown)) {
                $this->notifications->notifyBudgetExceeded($budget);
                $budget->update(['exceeded_notified_at' => now()]);
            }
        } elseif ($budget->status === BudgetStatus::Exceeded) {
            $budget->update(['status' => BudgetStatus::Active]);
        }
    }

    public function processOverdueInvoices(): int
    {
        $count = 0;
        $today = Carbon::today();

        $invoices = Invoice::query()
            ->where('status', InvoiceStatus::Pending)
            ->whereDate('due_date', '<', $today)
            ->get();

        foreach ($invoices as $invoice) {
            $invoice->update(['status' => InvoiceStatus::Overdue]);

            $cooldown = Carbon::now()->subHours(24);
            if (! $invoice->overdue_notified_at || $invoice->overdue_notified_at->lt($cooldown)) {
                $this->notifications->notifyInvoiceOverdue($invoice);
                $invoice->update(['overdue_notified_at' => now()]);
                $count++;
            }

            $this->history(null, 'invoice_overdue', 'invoice', $invoice->id,
                __('messages.accounting.history_invoice_overdue', ['number' => $invoice->invoice_number]));
        }

        return $count;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function exportFinancialData(?string $type = null): array
    {
        $rows = [];

        if ($type === null || $type === 'expenses') {
            foreach (Expense::with('employee:id,name')->get() as $e) {
                $rows[] = [
                    'record_type' => 'expense',
                    'id' => $e->id,
                    'title' => $e->title,
                    'amount' => (float) $e->amount,
                    'category' => $e->category->value,
                    'status' => $e->status->value,
                    'date' => $e->date->toDateString(),
                    'department' => $e->department,
                    'employee' => $e->employee?->name,
                ];
            }
        }

        if ($type === null || $type === 'invoices') {
            foreach (Invoice::with('client:id,name')->get() as $inv) {
                $rows[] = [
                    'record_type' => 'invoice',
                    'id' => $inv->id,
                    'invoice_number' => $inv->invoice_number,
                    'client' => $inv->client?->name,
                    'amount' => (float) $inv->amount,
                    'status' => $inv->status->value,
                    'due_date' => $inv->due_date->toDateString(),
                ];
            }
        }

        if ($type === null || $type === 'transactions') {
            foreach (FinancialTransaction::all() as $tx) {
                $rows[] = [
                    'record_type' => 'transaction',
                    'id' => $tx->id,
                    'type' => $tx->type->value,
                    'amount' => (float) $tx->amount,
                    'date' => $tx->transaction_date->toDateString(),
                    'reference' => $tx->reference,
                ];
            }
        }

        return $rows;
    }

    private function nextInvoiceNumber(): string
    {
        $year = now()->format('Y');
        $last = Invoice::where('invoice_number', 'like', "INV-{$year}-%")
            ->orderByDesc('id')
            ->value('invoice_number');

        $seq = 1;
        if ($last && preg_match('/INV-\d{4}-(\d+)/', $last, $m)) {
            $seq = (int) $m[1] + 1;
        }

        return sprintf('INV-%s-%04d', $year, $seq);
    }

    public function audit(
        ?int $userId,
        string $action,
        string $entityType,
        ?int $entityId,
        string $description,
        ?array $meta = null,
    ): void {
        FinanceAuditLog::create([
            'user_id' => $userId,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'description' => $description,
            'meta' => $meta,
            'occurred_at' => now(),
        ]);
    }

    public function history(
        ?int $userId,
        string $eventType,
        string $entityType,
        ?int $entityId,
        string $summary,
        ?array $payload = null,
    ): void {
        FinanceHistory::create([
            'user_id' => $userId,
            'event_type' => $eventType,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'summary' => $summary,
            'payload' => $payload,
            'occurred_at' => now(),
        ]);
    }
}
