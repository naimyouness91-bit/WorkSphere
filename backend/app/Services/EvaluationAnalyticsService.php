<?php

namespace App\Services;

use App\Enums\EvaluationStatus;
use App\Models\Employee;
use App\Models\Evaluation;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class EvaluationAnalyticsService
{
    private const IMPROVEMENT_THRESHOLD = 3.0;

    private const TOP_PERFORMER_LIMIT = 5;

    public function averagesForEmployees(?Builder $baseQuery = null): array
    {
        $query = $baseQuery
            ? (clone $baseQuery)
            : Evaluation::query();

        $query->whereIn('status', [
            EvaluationStatus::Submitted,
            EvaluationStatus::Finalized,
        ]);

        $rows = $query
            ->select('employee_id')
            ->selectRaw('AVG(score) as average_score')
            ->selectRaw('COUNT(*) as evaluation_count')
            ->groupBy('employee_id')
            ->get();

        $employees = User::query()
            ->whereIn('id', $rows->pluck('employee_id'))
            ->get()
            ->keyBy('id');

        $averages = $rows->map(function ($row) use ($employees) {
            $employee = $employees->get($row->employee_id);

            return [
                'employee_id' => (int) $row->employee_id,
                'employee_name' => $employee?->name ?? '',
                'employee_email' => $employee?->email ?? '',
                'average_score' => round((float) $row->average_score, 2),
                'evaluation_count' => (int) $row->evaluation_count,
            ];
        })->values()->all();

        $overall = count($averages) > 0
            ? round(collect($averages)->avg('average_score'), 2)
            : 0;

        return [
            'employee_averages' => $averages,
            'overall_average' => $overall,
        ];
    }

    public function dashboardKpis(): array
    {
        $base = Evaluation::query()->whereIn('status', [
            EvaluationStatus::Submitted,
            EvaluationStatus::Finalized,
        ]);

        $stats = $this->averagesForEmployees($base);
        $sorted = collect($stats['employee_averages'])->sortByDesc('average_score')->values();

        $topPerformers = $sorted->take(self::TOP_PERFORMER_LIMIT)->values()->all();
        $needsImprovement = $sorted
            ->filter(fn (array $row) => $row['average_score'] < self::IMPROVEMENT_THRESHOLD)
            ->take(self::TOP_PERFORMER_LIMIT)
            ->values()
            ->all();

        return [
            'average_performance_score' => $stats['overall_average'],
            'top_performers' => $topPerformers,
            'needs_improvement' => $needsImprovement,
            'total_evaluations' => (clone $base)->count(),
        ];
    }

    public function applyDepartmentFilter(Builder $query, string $department): void
    {
        $emails = Employee::query()
            ->where('department', $department)
            ->pluck('email');

        $userIds = User::query()
            ->whereIn('email', $emails)
            ->pluck('id');

        $query->whereIn('employee_id', $userIds);
    }

    public function departmentOptions(): array
    {
        return Employee::query()
            ->distinct()
            ->orderBy('department')
            ->pluck('department')
            ->filter()
            ->values()
            ->all();
    }
}
