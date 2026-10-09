<?php

namespace App\Services;

use App\Enums\EvaluationStatus;
use App\Enums\ProjectStatus;
use App\Enums\RequestStatus;
use App\Enums\TrainingStatus;
use App\Enums\UserRole;
use App\Models\Document;
use App\Models\Employee;
use App\Models\Evaluation;
use App\Models\InternalRequest;
use App\Models\Project;
use App\Models\Training;
use App\Models\AssistantInteraction;
use App\Models\User;
use App\Services\Integrations\IntegrationManager;
use Carbon\Carbon;

class HomeDashboardService
{
    public function __construct(
        private GamificationService $gamification,
        private ComplianceService $compliance,
        private AssetService $assets,
        private ProjectManagementService $projectManagement,
        private KnowledgeBaseService $knowledge,
        private RecruitmentService $recruitment,
        private CrmService $crm,
        private HelpdeskService $helpdesk,
        private ProcurementService $procurement,
        private AccountingService $accounting,
        private SecurityService $security,
        private IntegrationManager $integrations,
        private \App\Services\Analytics\AdvancedAnalyticsService $advancedAnalytics,
        private OfflineSyncService $offlineSync,
        private CustomizationService $customization,
    ) {}

    public function overview(User $user): array
    {
        return [
            'kpis' => $this->kpis($user),
            'recent_activity' => $this->recentActivity($user),
        ];
    }

    private function kpis(User $user): array
    {
        $isEmployeeOnly = $user->role === UserRole::Employee;

        $pendingRequestsQuery = InternalRequest::query()->where('status', RequestStatus::Pending);
        if ($isEmployeeOnly) {
            $pendingRequestsQuery->where('employee_id', $user->id);
        }

        $upcomingTrainings = Training::query()
            ->where('status', TrainingStatus::Scheduled)
            ->where('start_date', '>=', Carbon::now())
            ->count();

        return [
            'total_employees' => $isEmployeeOnly ? null : Employee::count(),
            'pending_requests' => $pendingRequestsQuery->count(),
            'upcoming_trainings' => $upcomingTrainings,
            'active_projects' => Project::where('status', ProjectStatus::Active)->count(),
            'project_management' => $this->projectManagement->statsForDashboard($user),
            'ai_suggestions_today' => AssistantInteraction::query()
                ->where('user_id', $user->id)
                ->where('interaction_type', 'suggest')
                ->whereDate('created_at', Carbon::today())
                ->count(),
            'gamification_stats' => $this->gamification->statsForDashboard($user),
            'compliance_status' => $this->compliance->statsForDashboard($user),
            'asset_stats' => $user->role === UserRole::Employee
                ? null
                : $this->assets->statsForDashboard(),
            'knowledge_base_stats' => $this->knowledge->statsForDashboard(),
            'recruitment_stats' => $this->recruitment->statsForDashboard($user),
            'crm_stats' => $user->role === UserRole::Employee
                ? null
                : $this->crm->statsForDashboard(),
            'helpdesk_stats' => $this->helpdesk->statsForDashboard($user),
            'inventory_stats' => $user->role === UserRole::Employee
                ? null
                : $this->procurement->statsForDashboard(),
            'finance_stats' => $this->accounting->statsForDashboard($user),
            'security_stats' => $this->security->statsForDashboard($user),
            'integration_stats' => $this->integrations->statsForDashboard($user),
            'analytics_stats' => $this->advancedAnalytics->statsForDashboard($user),
            'offline_stats' => $this->offlineSync->statsForDashboard($user),
            'customization_stats' => $this->customization->statsForDashboard($user),
        ];
    }

    private function recentActivity(User $user): array
    {
        $isEmployeeOnly = $user->role === UserRole::Employee;

        $requestsQuery = InternalRequest::query()
            ->with('employee:id,name')
            ->latest();
        if ($isEmployeeOnly) {
            $requestsQuery->where('employee_id', $user->id);
        }

        $documentsQuery = Document::query()
            ->with('employee:id,name')
            ->latest('uploaded_at');
        if ($isEmployeeOnly) {
            $documentsQuery->where('employee_id', $user->id);
        }

        $evaluationsQuery = Evaluation::query()
            ->with(['employee:id,name', 'evaluator:id,name'])
            ->whereIn('status', [EvaluationStatus::Submitted, EvaluationStatus::Finalized])
            ->latest('updated_at');
        if ($isEmployeeOnly) {
            $evaluationsQuery->where('employee_id', $user->id);
        }

        $items = collect();

        foreach ($requestsQuery->limit(8)->get() as $request) {
            $items->push([
                'type' => 'request',
                'id' => $request->id,
                'title' => $request->title,
                'subtitle' => $request->employee?->name,
                'status' => $request->status->value,
                'occurred_at' => $request->created_at?->toIso8601String(),
            ]);
        }

        foreach ($documentsQuery->limit(8)->get() as $document) {
            $items->push([
                'type' => 'document',
                'id' => $document->id,
                'title' => $document->title,
                'subtitle' => $document->employee?->name,
                'status' => null,
                'occurred_at' => ($document->uploaded_at ?? $document->created_at)?->toIso8601String(),
            ]);
        }

        foreach ($evaluationsQuery->limit(8)->get() as $evaluation) {
            $items->push([
                'type' => 'evaluation',
                'id' => $evaluation->id,
                'title' => $evaluation->review_period,
                'subtitle' => $evaluation->employee?->name,
                'status' => $evaluation->status->value,
                'occurred_at' => $evaluation->updated_at?->toIso8601String(),
            ]);
        }

        return $items
            ->filter(fn ($item) => $item['occurred_at'] !== null)
            ->sortByDesc('occurred_at')
            ->take(12)
            ->values()
            ->all();
    }
}
