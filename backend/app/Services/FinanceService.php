<?php

namespace App\Services;

use App\Enums\BudgetPeriod;
use App\Enums\ExpenseStatus;
use App\Models\Budget;
use App\Models\Employee;
use App\Models\Expense;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class FinanceService
{
    public function resolveDepartmentForUser(User $user): string
    {
        $employee = Employee::query()->where('email', $user->email)->first();

        return $employee?->department ?? 'General';
    }

    public function departmentOptions(): array
    {
        return Employee::query()
            ->select('department')
            ->distinct()
            ->orderBy('department')
            ->pluck('department')
            ->all();
    }

    public function syncBudgetSpent(Budget $budget): void
    {
        $start = $this->periodStart($budget);
        $end = $this->periodEnd($budget);

        $spent = Expense::query()
            ->where('department', $budget->department)
            ->where('status', ExpenseStatus::Approved)
            ->whereBetween('date', [$start->toDateString(), $end->toDateString()])
            ->sum('amount');

        $budget->update(['spent_amount' => $spent]);

        app(AccountingService::class)->checkBudgetAlerts($budget->fresh());
    }

    public function syncAllBudgetsForDepartment(string $department): void
    {
        Budget::query()->where('department', $department)->each(fn (Budget $b) => $this->syncBudgetSpent($b));
    }

    public function dashboardKpis(): array
    {
        $totalExpenses = (float) Expense::where('status', ExpenseStatus::Approved)->sum('amount');
        $pendingExpenses = (float) Expense::where('status', ExpenseStatus::Pending)->sum('amount');
        $totalAllocated = (float) Budget::sum('allocated_amount');
        $totalSpent = (float) Budget::sum('spent_amount');

        return [
            'total_expenses' => round($totalExpenses, 2),
            'pending_expenses' => round($pendingExpenses, 2),
            'total_budget_allocated' => round($totalAllocated, 2),
            'total_remaining_funds' => round(max(0, $totalAllocated - $totalSpent), 2),
        ];
    }

    public function expensesByCategory(): array
    {
        return Expense::query()
            ->where('status', ExpenseStatus::Approved)
            ->select('category', DB::raw('SUM(amount) as total'))
            ->groupBy('category')
            ->get()
            ->map(fn ($row) => [
                'category' => $row->category->value ?? $row->category,
                'total' => round((float) $row->total, 2),
            ])
            ->values()
            ->all();
    }

    public function budgetUsageByDepartment(): array
    {
        return Budget::query()
            ->orderBy('department')
            ->get()
            ->groupBy('department')
            ->map(function ($budgets, $department) {
                $allocated = $budgets->sum('allocated_amount');
                $spent = $budgets->sum('spent_amount');

                return [
                    'department' => $department,
                    'allocated' => round((float) $allocated, 2),
                    'spent' => round((float) $spent, 2),
                    'remaining' => round(max(0, $allocated - $spent), 2),
                ];
            })
            ->values()
            ->all();
    }

    public function financialReport(?int $year = null): array
    {
        $year = $year ?? (int) now()->year;

        $driver = DB::connection()->getDriverName();
        $monthExpression = match ($driver) {
            'sqlite' => "CAST(strftime('%m', date) AS INTEGER)",
            default => 'MONTH(date)',
        };

        $monthlyExpenses = Expense::query()
            ->where('status', ExpenseStatus::Approved)
            ->whereYear('date', $year)
            ->select(
                DB::raw("{$monthExpression} as month"),
                DB::raw('SUM(amount) as total')
            )
            ->groupBy('month')
            ->pluck('total', 'month');

        $months = [];
        for ($m = 1; $m <= 12; $m++) {
            $months[] = [
                'month' => $m,
                'total' => round((float) ($monthlyExpenses[$m] ?? 0), 2),
            ];
        }

        return [
            'year' => $year,
            'total_approved' => round((float) Expense::where('status', ExpenseStatus::Approved)->whereYear('date', $year)->sum('amount'), 2),
            'by_category' => $this->expensesByCategory(),
            'by_department' => $this->budgetUsageByDepartment(),
            'monthly' => $months,
        ];
    }

    private function periodStart(Budget $budget): Carbon
    {
        if ($budget->period === BudgetPeriod::Yearly) {
            return Carbon::create($budget->period_year, 1, 1)->startOfDay();
        }

        return Carbon::create($budget->period_year, $budget->period_month ?? 1, 1)->startOfMonth();
    }

    private function periodEnd(Budget $budget): Carbon
    {
        if ($budget->period === BudgetPeriod::Yearly) {
            return Carbon::create($budget->period_year, 12, 31)->endOfDay();
        }

        return Carbon::create($budget->period_year, $budget->period_month ?? 1, 1)->endOfMonth();
    }
}
