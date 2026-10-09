<?php

namespace App\Services\Analytics;

use App\Enums\AttendanceStatus;
use App\Enums\EvaluationStatus;
use App\Enums\ExpenseStatus;
use App\Enums\InsightCategory;
use App\Enums\RequestStatus;
use App\Enums\UserRole;
use App\Models\AnalyticsAuditLog;
use App\Models\Budget;
use App\Models\Employee;
use App\Models\Evaluation;
use App\Models\Expense;
use App\Models\Insight;
use App\Models\InternalRequest;
use App\Models\Report;
use App\Models\Training;
use App\Models\User;
use App\Services\NotificationService;
use App\Services\ReportingAnalyticsService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AdvancedAnalyticsService
{
    public function __construct(
        private ReportingAnalyticsService $reporting,
        private NotificationService $notifications,
    ) {}

    public function canAccess(User $user): bool
    {
        return $user->hasAnyRole([UserRole::Admin->value, UserRole::Manager->value]);
    }

    public function overview(array $filters): array
    {
        $stats = $this->reporting->getStatistics($filters);

        return [
            'statistics' => $stats,
            'analytics_kpis' => $this->analyticsKpis(),
            'heatmap' => $this->departmentPerformanceHeatmap($filters),
            'insights_preview' => $this->activeInsights()->take(3)->values()->all(),
        ];
    }

    public function analyticsKpis(): array
    {
        $since = Carbon::now()->subDays(30);

        return [
            'reports_generated' => Report::where('generated_at', '>=', $since)->count(),
            'insights_available' => Insight::where('is_active', true)->count(),
            'prediction_accuracy' => config('analytics.prediction_accuracy', 0.82),
        ];
    }

    public function statsForDashboard(User $user): ?array
    {
        if ($user->role === UserRole::Employee) {
            return null;
        }

        return $this->analyticsKpis();
    }

    public function activeInsights(?string $category = null)
    {
        $query = Insight::query()
            ->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', Carbon::now());
            })
            ->latest();

        if ($category) {
            $query->where('category', $category);
        }

        return $query->get()->map(fn (Insight $i) => $this->formatInsight($i));
    }

    public function generateInsights(bool $notify = true): int
    {
        $created = 0;
        $candidates = array_merge(
            $this->predictTurnoverRisk(),
            $this->forecastPerformanceTrends(),
            $this->detectFinancialRisks(),
            $this->buildAiRecommendations(),
        );

        $mlExtras = $this->fetchMlPredictions();
        $candidates = array_merge($candidates, $mlExtras);

        foreach ($candidates as $item) {
            $category = $item['category'] instanceof InsightCategory
                ? $item['category']
                : InsightCategory::from($item['category']);

            $exists = Insight::query()
                ->where('is_active', true)
                ->where('title', $item['title'])
                ->where('category', $category)
                ->exists();

            if ($exists) {
                continue;
            }

            $insight = Insight::create([
                'title' => $item['title'],
                'description' => $item['description'],
                'category' => $category,
                'confidence_score' => $item['confidence_score'],
                'meta' => $item['meta'] ?? null,
                'recommendation' => $item['recommendation'] ?? null,
                'expires_at' => Carbon::now()->addDays(14),
            ]);

            $created++;

            if ($notify && $item['confidence_score'] >= 0.75) {
                $this->notifications->notifyAdminsAndManagers(
                    $item['description'],
                    \App\Enums\NotificationType::Info,
                    __('messages.analytics.insight_notification_title'),
                    \App\Enums\NotificationCategory::System,
                );
            }
        }

        return $created;
    }

    public function audit(User $user, string $action, string $description, ?Report $report = null, ?array $meta = null): void
    {
        AnalyticsAuditLog::create([
            'user_id' => $user->id,
            'report_id' => $report?->id,
            'action' => $action,
            'description' => $description,
            'meta' => $meta,
            'occurred_at' => Carbon::now(),
        ]);
    }

    public function departmentPerformanceHeatmap(array $filters): array
    {
        $from = $filters['date_from'] ?? Carbon::now()->subMonths(5)->toDateString();
        $to = $filters['date_to'] ?? Carbon::now()->toDateString();

        $departments = Employee::query()->distinct()->pluck('department');

        $rows = [];
        foreach ($departments as $department) {
            $emails = Employee::where('department', $department)->pluck('email');
            $userIds = User::whereIn('email', $emails)->pluck('id');

            $avgScore = Evaluation::query()
                ->whereIn('employee_id', $userIds)
                ->whereIn('status', [EvaluationStatus::Submitted, EvaluationStatus::Finalized])
                ->whereBetween('updated_at', [$from, $to.' 23:59:59'])
                ->avg('score');

            $attendance = $this->attendanceRateForDepartment($department, $from, $to);
            $rejected = InternalRequest::query()
                ->whereIn('employee_id', $userIds)
                ->where('status', RequestStatus::Rejected)
                ->whereBetween('created_at', [$from, $to.' 23:59:59'])
                ->count();

            $rows[] = [
                'department' => $department,
                'performance' => round((float) ($avgScore ?? 0), 2),
                'attendance' => $attendance,
                'risk_score' => min(100, round(($rejected * 10) + max(0, (3 - ($avgScore ?? 3)) * 20), 1)),
            ];
        }

        return $rows;
    }

    private function predictTurnoverRisk(): array
    {
        $insights = [];
        $since = Carbon::now()->subMonths(3);

        $byDept = Employee::query()
            ->select('department', DB::raw('COUNT(*) as headcount'))
            ->groupBy('department')
            ->get();

        foreach ($byDept as $row) {
            $emails = Employee::where('department', $row->department)->pluck('email');
            $userIds = User::whereIn('email', $emails)->pluck('id');

            $lowScores = Evaluation::query()
                ->whereIn('employee_id', $userIds)
                ->whereIn('status', [EvaluationStatus::Submitted, EvaluationStatus::Finalized])
                ->where('score', '<', 2.5)
                ->where('updated_at', '>=', $since)
                ->count();

            $rejections = InternalRequest::query()
                ->whereIn('employee_id', $userIds)
                ->where('status', RequestStatus::Rejected)
                ->where('created_at', '>=', $since)
                ->count();

            $risk = min(0.95, 0.35 + ($lowScores * 0.08) + ($rejections * 0.05));

            if ($risk >= 0.65 && $row->headcount >= 3) {
                $insights[] = [
                    'title' => __('messages.analytics.insights.turnover_title', ['dept' => $row->department]),
                    'description' => __('messages.analytics.insights.turnover_body', [
                        'dept' => $row->department,
                        'risk' => round($risk * 100),
                    ]),
                    'category' => InsightCategory::Turnover,
                    'confidence_score' => round($risk, 2),
                    'meta' => ['department' => $row->department, 'headcount' => $row->headcount],
                    'recommendation' => [
                        'action' => __('messages.analytics.recommendations.turnover_training'),
                        'priority' => 'high',
                    ],
                ];
            }
        }

        return $insights;
    }

    private function forecastPerformanceTrends(): array
    {
        $insights = [];
        $months = Evaluation::query()
            ->whereIn('status', [EvaluationStatus::Submitted, EvaluationStatus::Finalized])
            ->where('updated_at', '>=', Carbon::now()->subMonths(6))
            ->get(['score', 'updated_at'])
            ->groupBy(fn ($e) => Carbon::parse($e->updated_at)->format('Y-m'))
            ->map(fn ($items) => round((float) $items->avg('score'), 2))
            ->sortKeys();

        if ($months->count() < 3) {
            return [];
        }

        $values = $months->values()->all();
        $latest = end($values);
        $previous = $values[count($values) - 2] ?? $latest;
        $delta = $latest - $previous;

        if (abs($delta) >= 0.2) {
            $trend = $delta > 0 ? 'improving' : 'declining';
            $insights[] = [
                'title' => __('messages.analytics.insights.performance_trend_title'),
                'description' => __('messages.analytics.insights.performance_trend_body', [
                    'trend' => $trend,
                    'delta' => round(abs($delta), 2),
                ]),
                'category' => InsightCategory::Performance,
                'confidence_score' => min(0.92, 0.7 + abs($delta) * 0.3),
                'meta' => ['series' => $months->all(), 'trend' => $trend],
                'recommendation' => [
                    'action' => $delta < 0
                        ? __('messages.analytics.recommendations.performance_coaching')
                        : __('messages.analytics.recommendations.performance_recognize'),
                    'priority' => $delta < 0 ? 'high' : 'medium',
                ],
            ];
        }

        return $insights;
    }

    private function detectFinancialRisks(): array
    {
        $insights = [];
        $allocated = (float) Budget::sum('allocated_amount');
        $spent = (float) Budget::sum('spent_amount');

        if ($allocated > 0) {
            $usage = $spent / $allocated;
            if ($usage >= 0.9) {
                $insights[] = [
                    'title' => __('messages.analytics.insights.budget_risk_title'),
                    'description' => __('messages.analytics.insights.budget_risk_body', [
                        'percent' => round($usage * 100, 1),
                    ]),
                    'category' => InsightCategory::Finance,
                    'confidence_score' => min(0.95, 0.75 + ($usage - 0.9) * 2),
                    'meta' => ['allocated' => $allocated, 'spent' => $spent],
                    'recommendation' => [
                        'action' => __('messages.analytics.recommendations.freeze_discretionary'),
                        'priority' => 'high',
                    ],
                ];
            }
        }

        $pendingExpenses = Expense::where('status', ExpenseStatus::Pending)->sum('amount');
        if ($pendingExpenses > 5000) {
            $insights[] = [
                'title' => __('messages.analytics.insights.expense_backlog_title'),
                'description' => __('messages.analytics.insights.expense_backlog_body', [
                    'amount' => number_format((float) $pendingExpenses, 2),
                ]),
                'category' => InsightCategory::Finance,
                'confidence_score' => 0.78,
                'meta' => ['pending_total' => $pendingExpenses],
            ];
        }

        return $insights;
    }

    private function buildAiRecommendations(): array
    {
        $recommendations = [];

        $lowTraining = Training::query()
            ->where('status', \App\Enums\TrainingStatus::Scheduled)
            ->where('start_date', '>=', Carbon::now())
            ->count();

        if ($lowTraining < 2) {
            $recommendations[] = [
                'title' => __('messages.analytics.insights.training_gap_title'),
                'description' => __('messages.analytics.insights.training_gap_body'),
                'category' => InsightCategory::Recommendation,
                'confidence_score' => 0.72,
                'recommendation' => [
                    'action' => __('messages.analytics.recommendations.schedule_training'),
                    'priority' => 'medium',
                ],
            ];
        }

        return $recommendations;
    }

    private function fetchMlPredictions(): array
    {
        $url = config('analytics.ml_service_url');
        if (! $url) {
            return [];
        }

        try {
            $response = Http::timeout(config('analytics.ml_service_timeout', 10))
                ->post(rtrim($url, '/').'/predict', [
                    'features' => $this->mlFeaturePayload(),
                ]);

            if (! $response->successful()) {
                return [];
            }

            $data = $response->json('insights', []);

            return collect($data)->map(fn ($row) => [
                'title' => $row['title'] ?? 'ML Insight',
                'description' => $row['description'] ?? '',
                'category' => InsightCategory::tryFrom($row['category'] ?? '') ?? InsightCategory::Recommendation,
                'confidence_score' => (float) ($row['confidence_score'] ?? 0.7),
                'meta' => $row['meta'] ?? ['source' => 'ml_service'],
            ])->all();
        } catch (\Throwable $e) {
            Log::warning('Analytics ML service unavailable: '.$e->getMessage());

            return [];
        }
    }

    private function mlFeaturePayload(): array
    {
        return [
            'departments' => $this->departmentPerformanceHeatmap([
                'date_from' => Carbon::now()->subMonths(6)->toDateString(),
                'date_to' => Carbon::now()->toDateString(),
            ]),
            'budget_usage' => Budget::sum('allocated_amount') > 0
                ? Budget::sum('spent_amount') / Budget::sum('allocated_amount')
                : 0,
        ];
    }

    private function attendanceRateForDepartment(string $department, string $from, string $to): float
    {
        $emails = Employee::where('department', $department)->pluck('email');
        $userIds = User::whereIn('email', $emails)->pluck('id');

        $records = \App\Models\Attendance::query()
            ->whereIn('employee_id', $userIds)
            ->whereBetween('date', [$from, $to])
            ->get();

        if ($records->isEmpty()) {
            return 0;
        }

        $present = $records->whereIn('status', [AttendanceStatus::Present, AttendanceStatus::Late])->count();

        return round(($present / $records->count()) * 100, 1);
    }

    private function formatInsight(Insight $insight): array
    {
        return [
            'id' => $insight->id,
            'title' => $insight->title,
            'description' => $insight->description,
            'category' => $insight->category->value,
            'confidence_score' => (float) $insight->confidence_score,
            'meta' => $insight->meta,
            'recommendation' => $insight->recommendation,
            'created_at' => $insight->created_at?->toIso8601String(),
        ];
    }
}
