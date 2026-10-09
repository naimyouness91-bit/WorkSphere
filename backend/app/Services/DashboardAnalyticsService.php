<?php

namespace App\Services;

use App\Enums\RequestStatus;
use App\Enums\RequestType;
use App\Models\Employee;
use App\Models\InternalRequest;
use App\Enums\SkillLevel;
use App\Enums\TrainingStatus;
use App\Enums\ApplicationStatus;
use App\Enums\JobStatus;
use App\Models\Application;
use App\Models\Job;
use App\Models\Payroll;
use App\Models\Skill;
use App\Models\Project;
use App\Models\Task;
use App\Models\Ticket;
use App\Models\Training;
use App\Enums\TicketStatus;
use App\Enums\ProjectStatus;
use App\Enums\TaskStatus;
use App\Services\EvaluationAnalyticsService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardAnalyticsService
{
    public function __construct(
        private EvaluationAnalyticsService $evaluationAnalytics,
        private AttendanceAnalyticsService $attendanceAnalytics,
        private FinanceService $financeService,
        private AuditAnalyticsService $auditAnalytics,
        private Integrations\IntegrationManager $integrationManager,
    ) {}

    public function getAnalytics(): array
    {
        $totalRequests = InternalRequest::count();
        $approvedCount = InternalRequest::where('status', RequestStatus::Approved)->count();

        return [
            'kpis' => [
                'total_employees' => Employee::count(),
                'total_requests' => $totalRequests,
                'acceptance_rate' => $totalRequests > 0
                    ? round(($approvedCount / $totalRequests) * 100, 1)
                    : 0,
            ],
            'requests_by_status' => $this->requestsByStatus(),
            'requests_by_type' => $this->requestsByType(),
            'requests_over_time' => $this->requestsOverTime(),
            'payroll_kpis' => $this->payrollKpis(),
            'training_skills_kpis' => $this->trainingSkillsKpis(),
            'evaluation_kpis' => $this->evaluationAnalytics->dashboardKpis(),
            'recruitment_kpis' => $this->recruitmentKpis(),
            'project_kpis' => $this->projectKpis(),
            'ticket_kpis' => $this->ticketKpis(),
            'attendance_kpis' => $this->attendanceAnalytics->dashboardKpis(),
            'finance_kpis' => $this->financeService->dashboardKpis(),
            'expenses_by_category' => $this->financeService->expensesByCategory(),
            'budget_usage_by_department' => $this->financeService->budgetUsageByDepartment(),
            'audit_kpis' => $this->auditAnalytics->dashboardKpis(),
            'security_alerts' => $this->auditAnalytics->securityAlerts(),
            'integration_kpis' => $this->integrationManager->dashboardKpis(),
        ];
    }

    private function ticketKpis(): array
    {
        $openCount = Ticket::whereIn('status', [
            TicketStatus::Open,
            TicketStatus::InProgress,
        ])->count();

        $resolved = Ticket::whereNotNull('resolved_at')->get(['created_at', 'resolved_at']);

        $averageResolutionHours = 0;

        if ($resolved->isNotEmpty()) {
            $totalHours = $resolved->sum(
                fn (Ticket $ticket) => $ticket->created_at->diffInHours($ticket->resolved_at)
            );
            $averageResolutionHours = round($totalHours / $resolved->count(), 1);
        }

        return [
            'open_tickets' => $openCount,
            'average_resolution_hours' => $averageResolutionHours,
            'total_tickets' => Ticket::count(),
        ];
    }

    private function projectKpis(): array
    {
        $today = Carbon::today()->toDateString();

        return [
            'active_projects' => Project::where('status', ProjectStatus::Active)->count(),
            'tasks_completed' => Task::where('status', TaskStatus::Done)->count(),
            'overdue_tasks' => Task::query()
                ->where('status', '!=', TaskStatus::Done)
                ->whereNotNull('due_date')
                ->whereDate('due_date', '<', $today)
                ->count(),
            'total_tasks' => Task::count(),
        ];
    }

    private function recruitmentKpis(): array
    {
        return [
            'open_jobs' => Job::where('status', JobStatus::Open)->count(),
            'applications_received' => Application::count(),
            'hires' => Application::where('status', ApplicationStatus::Hired)->count(),
            'pending_applications' => Application::where('status', ApplicationStatus::Applied)->count(),
        ];
    }

    private function trainingSkillsKpis(): array
    {
        $completedTrainings = Training::where('status', TrainingStatus::Completed)->count();
        $totalTrainings = Training::count();

        $levelScores = [
            SkillLevel::Beginner->value => 1,
            SkillLevel::Intermediate->value => 2,
            SkillLevel::Advanced->value => 3,
        ];

        $skills = Skill::all();
        $averageSkillLevel = 0;

        if ($skills->isNotEmpty()) {
            $sum = $skills->sum(fn (Skill $skill) => $levelScores[$skill->level->value] ?? 1);
            $averageSkillLevel = round($sum / $skills->count(), 2);
        }

        return [
            'completed_trainings' => $completedTrainings,
            'total_trainings' => $totalTrainings,
            'average_skill_level' => $averageSkillLevel,
            'total_skills' => $skills->count(),
        ];
    }

    private function payrollKpis(): array
    {
        $count = Payroll::count();
        $totalCost = (float) Payroll::sum('net_salary');
        $averageSalary = $count > 0
            ? round((float) Payroll::avg('net_salary'), 2)
            : 0;

        return [
            'total_payroll_cost' => round($totalCost, 2),
            'average_salary' => $averageSalary,
            'record_count' => $count,
        ];
    }

    private function requestsByStatus(): array
    {
        $counts = InternalRequest::query()
            ->select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status');

        return collect(RequestStatus::cases())->map(fn (RequestStatus $status) => [
            'status' => $status->value,
            'count' => (int) ($counts[$status->value] ?? $counts[$status->name] ?? 0),
        ])->values()->all();
    }

    private function requestsByType(): array
    {
        $counts = InternalRequest::query()
            ->select('type', DB::raw('COUNT(*) as count'))
            ->groupBy('type')
            ->pluck('count', 'type');

        return collect(RequestType::cases())->map(fn (RequestType $type) => [
            'type' => $type->value,
            'count' => (int) ($counts[$type->value] ?? $counts[$type->name] ?? 0),
        ])->values()->all();
    }

    private function requestsOverTime(int $days = 30): array
    {
        $start = Carbon::today()->subDays($days - 1);

        $driver = DB::connection()->getDriverName();
        $dateExpression = match ($driver) {
            'sqlite' => "strftime('%Y-%m-%d', created_at)",
            default => 'DATE(created_at)',
        };

        $raw = InternalRequest::query()
            ->where('created_at', '>=', $start)
            ->select(DB::raw("{$dateExpression} as date"), DB::raw('COUNT(*) as count'))
            ->groupBy('date')
            ->orderBy('date')
            ->pluck('count', 'date');

        $series = [];
        for ($i = 0; $i < $days; $i++) {
            $date = $start->copy()->addDays($i)->format('Y-m-d');
            $series[] = [
                'date' => $date,
                'count' => (int) ($raw[$date] ?? 0),
            ];
        }

        return $series;
    }
}
