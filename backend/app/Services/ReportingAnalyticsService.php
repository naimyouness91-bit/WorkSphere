<?php

namespace App\Services;

use App\Enums\AttendanceStatus;
use App\Enums\EvaluationStatus;
use App\Enums\ExpenseStatus;
use App\Enums\RequestStatus;
use App\Enums\RequestType;
use App\Models\Attendance;
use App\Models\Budget;
use App\Models\Employee;
use App\Models\Evaluation;
use App\Models\Expense;
use App\Models\InternalRequest;
use App\Models\Payroll;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ReportingAnalyticsService
{
    public function __construct(
        private FinanceService $financeService,
    ) {}

    public function resolveFilters(array $input): array
    {
        $dateTo = isset($input['date_to'])
            ? Carbon::parse($input['date_to'])->endOfDay()
            : Carbon::now()->endOfDay();

        $dateFrom = isset($input['date_from'])
            ? Carbon::parse($input['date_from'])->startOfDay()
            : $dateTo->copy()->subMonths(5)->startOfMonth();

        return [
            'module' => $input['module'] ?? 'all',
            'department' => $input['department'] ?? null,
            'date_from' => $dateFrom->toDateString(),
            'date_to' => $dateTo->toDateString(),
        ];
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

    public function getStatistics(array $filters): array
    {
        $module = $filters['module'] ?? 'all';

        $data = [
            'filters' => $filters,
            'kpis' => $this->kpis($filters),
            'comparative' => $this->comparativeAnalytics($filters),
        ];

        if ($module === 'all' || $module === 'requests') {
            $data['requests'] = $this->requestsAnalytics($filters);
        }
        if ($module === 'all' || $module === 'payroll') {
            $data['payroll'] = $this->payrollAnalytics($filters);
        }
        if ($module === 'all' || $module === 'attendance') {
            $data['attendance'] = $this->attendanceAnalytics($filters);
        }
        if ($module === 'all' || $module === 'finance') {
            $data['finance'] = $this->financeAnalytics($filters);
        }
        if ($module === 'all' || $module === 'performance') {
            $data['performance'] = $this->performanceAnalytics($filters);
        }
        if ($module === 'all' || $module === 'hr') {
            $data['hr'] = [
                'attendance' => $this->attendanceAnalytics($filters),
                'requests' => $this->requestsAnalytics($filters),
            ];
        }

        return $data;
    }

    public function buildPayloadForType(string $type, array $filters): array
    {
        $filters['module'] = $type;

        return $this->getStatistics($filters);
    }

    public function drillDown(string $module, string $segment, array $filters): array
    {
        return match ($module) {
            'requests' => $this->drillDownRequests($segment, $filters),
            'payroll' => $this->drillDownPayroll($segment, $filters),
            'attendance' => $this->drillDownAttendance($segment, $filters),
            'finance' => $this->drillDownFinance($segment, $filters),
            'performance' => $this->drillDownPerformance($segment, $filters),
            default => ['items' => []],
        };
    }

    private function kpis(array $filters): array
    {
        $from = $filters['date_from'];
        $to = $filters['date_to'];
        $userIds = $this->userIdsForDepartment($filters['department'] ?? null);

        $requestsQuery = InternalRequest::query()->whereBetween('created_at', [$from, $to.' 23:59:59']);
        if ($userIds !== null) {
            $requestsQuery->whereIn('employee_id', $userIds);
        }
        $requestCount = $requestsQuery->count();

        $prevFrom = Carbon::parse($from)->subMonths(1)->toDateString();
        $prevTo = Carbon::parse($to)->subMonths(1)->toDateString();
        $prevRequests = InternalRequest::query()
            ->whereBetween('created_at', [$prevFrom, $prevTo.' 23:59:59']);
        if ($userIds !== null) {
            $prevRequests->whereIn('employee_id', $userIds);
        }
        $prevCount = $prevRequests->count();
        $requestTrend = $prevCount > 0
            ? round((($requestCount - $prevCount) / $prevCount) * 100, 1)
            : ($requestCount > 0 ? 100 : 0);

        $payrollQuery = Payroll::query()
            ->whereBetween('pay_date', [$from, $to]);
        if ($filters['department'] ?? null) {
            $payrollQuery->whereHas('employee', fn ($q) => $q->where('department', $filters['department']));
        }
        $payrollTotal = (float) $payrollQuery->sum('net_salary');

        $attendanceRate = $this->attendanceRateForRange($from, $to, $userIds);

        $budgetAllocated = (float) Budget::sum('allocated_amount');
        $budgetSpent = (float) Budget::sum('spent_amount');
        $budgetUsage = $budgetAllocated > 0
            ? round(($budgetSpent / $budgetAllocated) * 100, 1)
            : 0;

        return [
            'monthly_requests' => $requestCount,
            'requests_trend_percent' => $requestTrend,
            'payroll_cost' => round($payrollTotal, 2),
            'attendance_rate' => $attendanceRate,
            'budget_usage_percent' => $budgetUsage,
        ];
    }

    private function requestsAnalytics(array $filters): array
    {
        $from = $filters['date_from'];
        $to = $filters['date_to'];
        $userIds = $this->userIdsForDepartment($filters['department'] ?? null);

        $base = InternalRequest::query()->whereBetween('created_at', [$from, $to.' 23:59:59']);
        if ($userIds !== null) {
            $base->whereIn('employee_id', $userIds);
        }

        $byStatus = (clone $base)
            ->select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->get()
            ->map(fn ($row) => [
                'status' => $row->status->value ?? $row->status,
                'count' => (int) $row->count,
            ])
            ->values()
            ->all();

        $byType = (clone $base)
            ->select('type', DB::raw('COUNT(*) as count'))
            ->groupBy('type')
            ->get()
            ->map(fn ($row) => [
                'type' => $row->type->value ?? $row->type,
                'count' => (int) $row->count,
            ])
            ->values()
            ->all();

        $overTime = $this->seriesByMonth(clone $base, 'created_at');

        return [
            'by_status' => $byStatus,
            'by_type' => $byType,
            'over_time' => $overTime,
        ];
    }

    private function payrollAnalytics(array $filters): array
    {
        $from = $filters['date_from'];
        $to = $filters['date_to'];

        $query = Payroll::query()
            ->with('employee:id,name,department')
            ->whereBetween('pay_date', [$from, $to]);

        if ($filters['department'] ?? null) {
            $query->whereHas('employee', fn ($q) => $q->where('department', $filters['department']));
        }

        $records = $query->get();

        $byMonth = $records->groupBy(fn (Payroll $p) => Carbon::parse($p->pay_date)->format('Y-m'))
            ->map(fn (Collection $items, string $month) => [
                'month' => $month,
                'total' => round((float) $items->sum('net_salary'), 2),
                'count' => $items->count(),
            ])
            ->sortKeys()
            ->values()
            ->all();

        $byDepartment = $records->groupBy(fn (Payroll $p) => $p->employee?->department ?? 'Unknown')
            ->map(fn (Collection $items, string $dept) => [
                'department' => $dept,
                'total' => round((float) $items->sum('net_salary'), 2),
            ])
            ->sortByDesc('total')
            ->values()
            ->all();

        return [
            'evolution' => $byMonth,
            'by_department' => $byDepartment,
            'total_cost' => round((float) $records->sum('net_salary'), 2),
        ];
    }

    private function attendanceAnalytics(array $filters): array
    {
        $from = $filters['date_from'];
        $to = $filters['date_to'];
        $userIds = $this->userIdsForDepartment($filters['department'] ?? null);

        $query = Attendance::query()->whereBetween('date', [$from, $to]);
        if ($userIds !== null) {
            $query->whereIn('employee_id', $userIds);
        }

        $records = $query->get();

        $byStatus = $records->groupBy(fn (Attendance $a) => $a->status->value)
            ->map(fn (Collection $items, string $status) => [
                'status' => $status,
                'count' => $items->count(),
            ])
            ->values()
            ->all();

        $overTime = $records->groupBy(fn (Attendance $a) => Carbon::parse($a->date)->format('Y-m'))
            ->map(fn (Collection $items, string $month) => [
                'month' => $month,
                'present' => $items->whereIn('status', [AttendanceStatus::Present, AttendanceStatus::Late])->count(),
                'absent' => $items->where('status', AttendanceStatus::Absent)->count(),
                'rate' => $items->count() > 0
                    ? round($items->whereIn('status', [AttendanceStatus::Present, AttendanceStatus::Late])->count() / $items->count() * 100, 1)
                    : 0,
            ])
            ->sortKeys()
            ->values()
            ->all();

        return [
            'by_status' => $byStatus,
            'over_time' => $overTime,
            'rate' => $this->attendanceRateForRange($from, $to, $userIds),
        ];
    }

    private function financeAnalytics(array $filters): array
    {
        $from = $filters['date_from'];
        $to = $filters['date_to'];

        $expenseQuery = Expense::query()
            ->where('status', ExpenseStatus::Approved)
            ->whereBetween('date', [$from, $to]);

        if ($filters['department'] ?? null) {
            $expenseQuery->where('department', $filters['department']);
        }

        $byCategory = $expenseQuery
            ->select('category', DB::raw('SUM(amount) as total'))
            ->groupBy('category')
            ->get()
            ->map(fn ($row) => [
                'category' => $row->category->value ?? $row->category,
                'total' => round((float) $row->total, 2),
            ])
            ->values()
            ->all();

        $budgetQuery = Budget::query();
        if ($filters['department'] ?? null) {
            $budgetQuery->where('department', $filters['department']);
        }

        $budgets = $budgetQuery->get();
        $allocated = (float) $budgets->sum('allocated_amount');
        $spent = (float) $budgets->sum('spent_amount');

        return [
            'expenses_by_category' => $byCategory,
            'budget' => [
                'allocated' => round($allocated, 2),
                'spent' => round($spent, 2),
                'remaining' => round(max(0, $allocated - $spent), 2),
                'usage_percent' => $allocated > 0 ? round(($spent / $allocated) * 100, 1) : 0,
            ],
            'by_department' => $this->financeService->budgetUsageByDepartment(),
        ];
    }

    private function performanceAnalytics(array $filters): array
    {
        $from = $filters['date_from'];
        $to = $filters['date_to'];

        $query = Evaluation::query()
            ->with('employee:id,name,email')
            ->whereIn('status', [EvaluationStatus::Submitted, EvaluationStatus::Finalized])
            ->whereBetween('updated_at', [$from, $to.' 23:59:59']);

        if ($filters['department'] ?? null) {
            $emails = Employee::where('department', $filters['department'])->pluck('email');
            $userIds = User::whereIn('email', $emails)->pluck('id');
            $query->whereIn('employee_id', $userIds);
        }

        $evaluations = $query->get();

        $distribution = [
            ['range' => '0-2', 'count' => $evaluations->where('score', '<', 2)->count()],
            ['range' => '2-3', 'count' => $evaluations->whereBetween('score', [2, 3])->count()],
            ['range' => '3-4', 'count' => $evaluations->whereBetween('score', [3, 4])->count()],
            ['range' => '4-5', 'count' => $evaluations->where('score', '>=', 4)->count()],
        ];

        $byEmployee = $evaluations->groupBy('employee_id')
            ->map(fn (Collection $items) => [
                'employee_id' => $items->first()->employee_id,
                'name' => $items->first()->employee?->name ?? '',
                'average_score' => round((float) $items->avg('score'), 2),
                'count' => $items->count(),
            ])
            ->sortByDesc('average_score')
            ->take(10)
            ->values()
            ->all();

        return [
            'score_distribution' => $distribution,
            'top_performers' => $byEmployee,
            'average_score' => $evaluations->isNotEmpty()
                ? round((float) $evaluations->avg('score'), 2)
                : 0,
        ];
    }

    private function comparativeAnalytics(array $filters): array
    {
        $from = $filters['date_from'];
        $to = $filters['date_to'];

        $evaluations = Evaluation::query()
            ->whereIn('status', [EvaluationStatus::Submitted, EvaluationStatus::Finalized])
            ->whereBetween('updated_at', [$from, $to.' 23:59:59'])
            ->get(['employee_id', 'score']);

        $scoresByEmployee = $evaluations->groupBy('employee_id')
            ->map(fn (Collection $items) => round((float) $items->avg('score'), 2));

        $attendanceQuery = Attendance::query()
            ->whereBetween('date', [$from, $to])
            ->get(['employee_id', 'status']);

        $ratesByEmployee = $attendanceQuery->groupBy('employee_id')
            ->map(function (Collection $items) {
                $total = $items->count();

                if ($total === 0) {
                    return 0;
                }

                $present = $items->whereIn('status', [AttendanceStatus::Present, AttendanceStatus::Late])->count();

                return round(($present / $total) * 100, 1);
            });

        $points = [];
        foreach ($scoresByEmployee as $employeeId => $score) {
            if (! $ratesByEmployee->has($employeeId)) {
                continue;
            }
            $user = User::find($employeeId);
            $points[] = [
                'employee_id' => $employeeId,
                'name' => $user?->name ?? 'Employee #'.$employeeId,
                'performance_score' => $score,
                'attendance_rate' => $ratesByEmployee[$employeeId],
            ];
        }

        return [
            'performance_vs_attendance' => collect($points)->take(20)->values()->all(),
        ];
    }

    private function drillDownRequests(string $segment, array $filters): array
    {
        $query = InternalRequest::query()
            ->with('employee:id,name,email')
            ->whereBetween('created_at', [$filters['date_from'], $filters['date_to'].' 23:59:59']);

        $userIds = $this->userIdsForDepartment($filters['department'] ?? null);
        if ($userIds !== null) {
            $query->whereIn('employee_id', $userIds);
        }

        if (RequestStatus::tryFrom($segment)) {
            $query->where('status', $segment);
        } elseif (RequestType::tryFrom($segment)) {
            $query->where('type', $segment);
        } elseif (preg_match('/^\d{4}-\d{2}$/', $segment)) {
            $start = Carbon::parse($segment.'-01')->startOfMonth();
            $end = $start->copy()->endOfMonth();
            $query->whereBetween('created_at', [$start, $end]);
        }

        return [
            'items' => $query->latest()->limit(50)->get()->map(fn (InternalRequest $r) => [
                'id' => $r->id,
                'title' => $r->title,
                'type' => $r->type->value,
                'status' => $r->status->value,
                'employee' => $r->employee?->name,
                'created_at' => $r->created_at?->toIso8601String(),
            ]),
        ];
    }

    private function drillDownPayroll(string $segment, array $filters): array
    {
        $query = Payroll::query()
            ->with('employee:id,name,department')
            ->whereBetween('pay_date', [$filters['date_from'], $filters['date_to']]);

        if ($filters['department'] ?? null) {
            $query->whereHas('employee', fn ($q) => $q->where('department', $filters['department']));
        }

        if (preg_match('/^\d{4}-\d{2}$/', $segment)) {
            $start = Carbon::parse($segment.'-01')->startOfMonth();
            $end = $start->copy()->endOfMonth();
            $query->whereBetween('pay_date', [$start, $end]);
        } elseif ($segment !== 'all') {
            $query->whereHas('employee', fn ($q) => $q->where('department', $segment));
        }

        return [
            'items' => $query->latest('pay_date')->limit(50)->get()->map(fn (Payroll $p) => [
                'id' => $p->id,
                'employee' => $p->employee?->name,
                'department' => $p->employee?->department,
                'net_salary' => (float) $p->net_salary,
                'pay_date' => $p->pay_date?->format('Y-m-d'),
            ]),
        ];
    }

    private function drillDownAttendance(string $segment, array $filters): array
    {
        $query = Attendance::query()
            ->with('employee:id,name,email')
            ->whereBetween('date', [$filters['date_from'], $filters['date_to']]);

        $userIds = $this->userIdsForDepartment($filters['department'] ?? null);
        if ($userIds !== null) {
            $query->whereIn('employee_id', $userIds);
        }

        if (AttendanceStatus::tryFrom($segment)) {
            $query->where('status', $segment);
        } elseif (preg_match('/^\d{4}-\d{2}$/', $segment)) {
            $start = Carbon::parse($segment.'-01')->startOfMonth();
            $end = $start->copy()->endOfMonth();
            $query->whereBetween('date', [$start->toDateString(), $end->toDateString()]);
        }

        return [
            'items' => $query->latest('date')->limit(50)->get()->map(fn (Attendance $a) => [
                'id' => $a->id,
                'employee' => $a->employee?->name,
                'date' => $a->date,
                'status' => $a->status->value,
                'working_hours' => round($a->working_minutes / 60, 2),
            ]),
        ];
    }

    private function drillDownFinance(string $segment, array $filters): array
    {
        $query = Expense::query()
            ->with('employee:id,name')
            ->where('status', ExpenseStatus::Approved)
            ->whereBetween('date', [$filters['date_from'], $filters['date_to']]);

        if ($filters['department'] ?? null) {
            $query->where('department', $filters['department']);
        }

        if ($segment !== 'all') {
            $query->where('category', $segment);
        }

        return [
            'items' => $query->latest('date')->limit(50)->get()->map(fn (Expense $e) => [
                'id' => $e->id,
                'title' => $e->title,
                'category' => $e->category->value,
                'amount' => (float) $e->amount,
                'department' => $e->department,
                'date' => $e->date?->format('Y-m-d'),
            ]),
        ];
    }

    private function drillDownPerformance(string $segment, array $filters): array
    {
        $query = Evaluation::query()
            ->with(['employee:id,name', 'evaluator:id,name'])
            ->whereIn('status', [EvaluationStatus::Submitted, EvaluationStatus::Finalized])
            ->whereBetween('updated_at', [$filters['date_from'], $filters['date_to'].' 23:59:59']);

        if (is_numeric($segment)) {
            $query->where('employee_id', (int) $segment);
        } elseif (str_starts_with($segment, 'range_')) {
            $range = str_replace('range_', '', $segment);
            match ($range) {
                '0-2' => $query->where('score', '<', 2),
                '2-3' => $query->whereBetween('score', [2, 3]),
                '3-4' => $query->whereBetween('score', [3, 4]),
                '4-5' => $query->where('score', '>=', 4),
                default => null,
            };
        }

        return [
            'items' => $query->latest('updated_at')->limit(50)->get()->map(fn (Evaluation $e) => [
                'id' => $e->id,
                'employee' => $e->employee?->name,
                'score' => (float) $e->score,
                'review_period' => $e->review_period,
                'status' => $e->status->value,
            ]),
        ];
    }

    private function userIdsForDepartment(?string $department): ?array
    {
        if (! $department) {
            return null;
        }

        $emails = Employee::where('department', $department)->pluck('email');

        return User::whereIn('email', $emails)->pluck('id')->all();
    }

    private function attendanceRateForRange(string $from, string $to, ?array $userIds): float
    {
        $query = Attendance::query()->whereBetween('date', [$from, $to]);
        if ($userIds !== null) {
            $query->whereIn('employee_id', $userIds);
        }

        $records = $query->get();
        if ($records->isEmpty()) {
            return 0;
        }

        $present = $records->whereIn('status', [AttendanceStatus::Present, AttendanceStatus::Late])->count();

        return round(($present / $records->count()) * 100, 1);
    }

    private function seriesByMonth($query, string $column): array
    {
        $driver = DB::connection()->getDriverName();
        $monthExpression = match ($driver) {
            'sqlite' => "strftime('%Y-%m', {$column})",
            default => "DATE_FORMAT({$column}, '%Y-%m')",
        };

        $raw = $query
            ->select(DB::raw("{$monthExpression} as month"), DB::raw('COUNT(*) as count'))
            ->groupBy('month')
            ->orderBy('month')
            ->pluck('count', 'month');

        return collect($raw)->map(fn ($count, $month) => [
            'month' => $month,
            'count' => (int) $count,
        ])->values()->all();
    }

    public function computeNextRunAt(string $frequency): Carbon
    {
        return match ($frequency) {
            'weekly' => Carbon::now()->addWeek()->startOfDay(),
            'monthly' => Carbon::now()->addMonth()->startOfDay(),
            default => Carbon::now()->addMonth(),
        };
    }
}
