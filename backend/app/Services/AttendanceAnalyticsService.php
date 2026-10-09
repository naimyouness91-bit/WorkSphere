<?php

namespace App\Services;

use App\Enums\AttendanceStatus;
use App\Enums\LeaveStatus;
use App\Models\Attendance;
use App\Models\Leave;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class AttendanceAnalyticsService
{
    public function dashboardKpis(): array
    {
        $monthStart = Carbon::now()->startOfMonth();
        $monthEnd = Carbon::now()->endOfMonth();
        $workdays = $this->countWeekdays($monthStart, $monthEnd);

        $records = Attendance::query()
            ->whereBetween('date', [$monthStart->toDateString(), $monthEnd->toDateString()])
            ->get();

        $presentCount = $records->whereIn('status', [
            AttendanceStatus::Present,
            AttendanceStatus::Late,
        ])->unique('employee_id')->count();

        $employeeCount = User::where('role', 'employee')->count() ?: 1;
        $expectedSlots = $workdays * $employeeCount;
        $attendanceRate = $expectedSlots > 0
            ? round(($records->whereIn('status', [AttendanceStatus::Present, AttendanceStatus::Late])->count() / $expectedSlots) * 100, 1)
            : 0;

        $withHours = $records->filter(fn (Attendance $a) => $a->working_minutes > 0);
        $avgHours = $withHours->isNotEmpty()
            ? round($withHours->avg(fn (Attendance $a) => $a->working_minutes / 60), 2)
            : 0;

        $leavesCount = Leave::query()
            ->where('status', LeaveStatus::Approved)
            ->where(function ($q) use ($monthStart, $monthEnd) {
                $q->whereBetween('start_date', [$monthStart, $monthEnd])
                    ->orWhereBetween('end_date', [$monthStart, $monthEnd]);
            })
            ->count();

        return [
            'attendance_rate' => $attendanceRate,
            'average_working_hours' => $avgHours,
            'approved_leaves_count' => $leavesCount,
            'present_employees' => $presentCount,
        ];
    }

    public function monthlyReport(int $year, int $month, ?int $employeeId = null): array
    {
        $start = Carbon::create($year, $month, 1)->startOfMonth();
        $end = $start->copy()->endOfMonth();

        $query = Attendance::query()
            ->with('employee')
            ->whereBetween('date', [$start->toDateString(), $end->toDateString()]);

        if ($employeeId) {
            $query->where('employee_id', $employeeId);
        }

        $records = $query->orderBy('date')->get();

        $byEmployee = $records->groupBy('employee_id')->map(function (Collection $items) {
            $totalMinutes = $items->sum('working_minutes');

            return [
                'employee_id' => $items->first()->employee_id,
                'employee_name' => $items->first()->employee?->name,
                'days_present' => $items->whereIn('status', [AttendanceStatus::Present, AttendanceStatus::Late])->count(),
                'days_late' => $items->where('status', AttendanceStatus::Late)->count(),
                'days_absent' => $items->where('status', AttendanceStatus::Absent)->count(),
                'total_working_hours' => round($totalMinutes / 60, 2),
            ];
        })->values();

        return [
            'year' => $year,
            'month' => $month,
            'workdays' => $this->countWeekdays($start, $end),
            'records' => $records,
            'by_employee' => $byEmployee,
        ];
    }

    public function employeeTotalHours(int $employeeId, ?string $from = null, ?string $to = null): float
    {
        $query = Attendance::query()->where('employee_id', $employeeId);

        if ($from) {
            $query->whereDate('date', '>=', $from);
        }
        if ($to) {
            $query->whereDate('date', '<=', $to);
        }

        $minutes = (int) $query->sum('working_minutes');

        return round($minutes / 60, 2);
    }

    private function countWeekdays(Carbon $start, Carbon $end): int
    {
        $count = 0;
        $cursor = $start->copy();

        while ($cursor->lte($end)) {
            if (! $cursor->isWeekend()) {
                $count++;
            }
            $cursor->addDay();
        }

        return max($count, 1);
    }
}
