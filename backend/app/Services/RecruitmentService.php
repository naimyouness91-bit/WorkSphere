<?php

namespace App\Services;

use App\Enums\ApplicationStatus;
use App\Enums\JobStatus;
use App\Enums\OnboardingTaskStatus;
use App\Enums\UserRole;
use App\Models\Candidate;
use App\Models\JobPosting;
use App\Models\OnboardingTask;
use App\Models\RecruitmentHistory;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;

class RecruitmentService
{
    public function __construct(
        private NotificationService $notifications,
    ) {}

    public function canManage(User $user): bool
    {
        return in_array($user->role, [UserRole::Admin, UserRole::Manager], true);
    }

    /**
     * @return Collection<int, JobPosting>
     */
    public function getActiveJobPostings(?string $department = null, ?string $status = null): Collection
    {
        $query = JobPosting::query()
            ->withCount('candidates')
            ->orderByDesc('created_at');

        if ($status) {
            $query->where('status', $status);
        } else {
            $query->where('status', JobStatus::Open);
        }

        if ($department) {
            $query->where('department', $department);
        }

        return $query->get();
    }

    public function addJobPosting(User $actor, array $data): JobPosting
    {
        $posting = JobPosting::create([
            'title' => $data['title'],
            'description' => $data['description'],
            'requirements' => $data['requirements'] ?? null,
            'department' => $data['department'],
            'location' => $data['location'] ?? 'Remote',
            'status' => $data['status'] ?? JobStatus::Open,
        ]);

        $this->recordHistory(
            $actor->id,
            'job_posting_created',
            'job_posting',
            $posting->id,
            __('messages.recruitment.history_job_created', ['title' => $posting->title]),
            ['job_posting_id' => $posting->id],
        );

        return $posting;
    }

    public function afterLegacyApplicationCreated(User $applicant, \App\Models\Application $application): void
    {
        $application->load('job');
        $this->recordHistory(
            $applicant->id,
            'candidate_applied',
            'candidate',
            $application->id,
            __('messages.recruitment.history_candidate_applied', [
                'name' => $application->candidate_name,
                'title' => $application->job?->title ?? '',
            ]),
            ['candidate_id' => $application->id],
        );
        $candidate = Candidate::find($application->id);
        if ($candidate) {
            $candidate->load('jobPosting');
            $this->notifications->notifyCandidateApplied($candidate);
        }
    }

    public function applyCandidate(User $applicant, array $data, UploadedFile $resume): Candidate
    {
        $path = $resume->store('applications/'.$data['job_id'], 'public');

        $candidate = Candidate::create([
            'job_id' => $data['job_id'],
            'user_id' => $applicant->id,
            'candidate_name' => $data['candidate_name'],
            'candidate_email' => $data['candidate_email'],
            'resume_path' => $path,
            'original_resume_filename' => $resume->getClientOriginalName(),
            'status' => ApplicationStatus::Applied,
        ]);

        $candidate->load('jobPosting');
        $this->recordHistory(
            $applicant->id,
            'candidate_applied',
            'candidate',
            $candidate->id,
            __('messages.recruitment.history_candidate_applied', [
                'name' => $candidate->candidate_name,
                'title' => $candidate->jobPosting?->title ?? '',
            ]),
            ['candidate_id' => $candidate->id, 'job_id' => $candidate->job_id],
        );

        $this->notifications->notifyCandidateApplied($candidate);

        return $candidate;
    }

    public function updateCandidateStatus(User $actor, Candidate $candidate, string $status): Candidate
    {
        $newStatus = ApplicationStatus::from($status);
        $previous = $candidate->status;
        $candidate->update(['status' => $newStatus]);
        $candidate->load('jobPosting');

        $this->recordHistory(
            $actor->id,
            'candidate_status_updated',
            'candidate',
            $candidate->id,
            __('messages.recruitment.history_status_updated', [
                'name' => $candidate->candidate_name,
                'from' => $previous->value,
                'to' => $newStatus->value,
            ]),
            ['candidate_id' => $candidate->id, 'status' => $newStatus->value],
        );

        if ($newStatus === ApplicationStatus::Hired && $previous !== ApplicationStatus::Hired) {
            $this->seedDefaultOnboardingTasks($actor, $candidate);
        }

        return $candidate;
    }

    private function seedDefaultOnboardingTasks(User $actor, Candidate $candidate): void
    {
        $templates = [
            ['task_title' => 'Complete HR paperwork', 'description' => 'Tax forms, emergency contacts, and policy acknowledgements.', 'days' => 3],
            ['task_title' => 'IT account setup', 'description' => 'Email, SSO, and workstation provisioning.', 'days' => 2],
            ['task_title' => 'Team orientation', 'description' => 'Meet your manager and onboarding buddy.', 'days' => 7],
        ];

        $user = User::where('email', $candidate->candidate_email)->first();
        if (! $user) {
            return;
        }

        foreach ($templates as $tpl) {
            OnboardingTask::create([
                'employee_id' => $user->id,
                'task_title' => $tpl['task_title'],
                'description' => $tpl['description'],
                'due_date' => Carbon::today()->addDays($tpl['days']),
                'status' => OnboardingTaskStatus::Pending,
                'created_by' => $actor->id,
            ]);
        }
    }

    /**
     * @return Collection<int, OnboardingTask>
     */
    public function getOnboardingTasks(?int $employeeId = null): Collection
    {
        $this->markOverdueTasks();

        $query = OnboardingTask::query()
            ->with(['employee:id,name,email', 'creator:id,name'])
            ->orderBy('due_date');

        if ($employeeId) {
            $query->where('employee_id', $employeeId);
        }

        return $query->get();
    }

    public function completeOnboardingTask(User $actor, OnboardingTask $task): OnboardingTask
    {
        $task->update([
            'status' => OnboardingTaskStatus::Completed,
            'completed_at' => now(),
        ]);

        $this->recordHistory(
            $actor->id,
            'onboarding_task_completed',
            'onboarding_task',
            $task->id,
            __('messages.recruitment.history_task_completed', ['title' => $task->task_title]),
            ['task_id' => $task->id],
        );

        return $task->load('employee:id,name');
    }

    public function markOverdueTasks(): void
    {
        OnboardingTask::query()
            ->where('status', OnboardingTaskStatus::Pending)
            ->whereDate('due_date', '<', Carbon::today())
            ->each(function (OnboardingTask $task) {
                $task->update(['status' => OnboardingTaskStatus::Overdue]);
                $this->notifications->notifyOnboardingTaskDue($task->fresh());
            });
    }

    public function notifyDueTasks(): void
    {
        $this->markOverdueTasks();

        OnboardingTask::query()
            ->whereIn('status', [OnboardingTaskStatus::Pending, OnboardingTaskStatus::Overdue])
            ->whereBetween('due_date', [Carbon::today(), Carbon::today()->addDays(3)])
            ->each(fn (OnboardingTask $task) => $this->notifications->notifyOnboardingTaskDue($task));
    }

    public function statsForDashboard(?User $user = null): array
    {
        $this->markOverdueTasks();

        $openPositions = JobPosting::where('status', JobStatus::Open)->count();
        $pipeline = Candidate::whereIn('status', [
            ApplicationStatus::Applied,
            ApplicationStatus::Shortlisted,
            ApplicationStatus::Interviewed,
        ])->count();

        $onboardingPending = OnboardingTask::whereIn('status', [
            OnboardingTaskStatus::Pending,
            OnboardingTaskStatus::Overdue,
        ])->count();

        if ($user && $user->role === UserRole::Employee) {
            $onboardingPending = OnboardingTask::where('employee_id', $user->id)
                ->whereIn('status', [OnboardingTaskStatus::Pending, OnboardingTaskStatus::Overdue])
                ->count();
        }

        return [
            'open_positions' => $openPositions,
            'candidates_in_pipeline' => $pipeline,
            'onboarding_tasks_pending' => $onboardingPending,
        ];
    }

    public function overview(User $viewer): array
    {
        $this->markOverdueTasks();

        return [
            'stats' => $this->statsForDashboard($viewer),
            'departments' => JobPosting::distinct()->orderBy('department')->pluck('department')->all(),
            'can_manage' => $this->canManage($viewer),
            'pipeline_stages' => ApplicationStatus::pipeline(),
        ];
    }

    public function recordHistory(
        ?int $userId,
        string $action,
        string $entityType,
        ?int $entityId,
        string $description,
        ?array $meta = null,
    ): void {
        RecruitmentHistory::create([
            'user_id' => $userId,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'description' => $description,
            'meta' => $meta,
            'occurred_at' => now(),
        ]);
    }

    /**
     * @return Collection<int, RecruitmentHistory>
     */
    public function history(int $limit = 50): Collection
    {
        return RecruitmentHistory::query()
            ->with('actor:id,name')
            ->orderByDesc('occurred_at')
            ->limit($limit)
            ->get();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function exportCandidates(?int $jobPostingId = null): array
    {
        $query = Candidate::query()->with('jobPosting:id,title,department');

        if ($jobPostingId) {
            $query->where('job_id', $jobPostingId);
        }

        return $query->orderByDesc('created_at')->get()->map(fn (Candidate $c) => [
            'id' => $c->id,
            'name' => $c->candidate_name,
            'email' => $c->candidate_email,
            'status' => $c->status->value,
            'job_title' => $c->jobPosting?->title,
            'department' => $c->jobPosting?->department,
            'applied_at' => $c->created_at?->toIso8601String(),
        ])->all();
    }
}
