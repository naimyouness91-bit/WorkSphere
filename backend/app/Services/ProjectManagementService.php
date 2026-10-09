<?php

namespace App\Services;

use App\Enums\MilestoneStatus;
use App\Enums\ProjectStatus;
use App\Enums\TaskStatus;
use App\Models\Milestone;
use App\Models\Project;
use App\Models\ProjectHistory;
use App\Models\Task;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class ProjectManagementService
{
    public function __construct(
        private AuditLogger $auditLogger,
        private NotificationService $notifications,
    ) {}

    public function logHistory(
        Project $project,
        ?User $user,
        string $action,
        string $description,
        ?array $meta = null,
    ): ProjectHistory {
        $entry = ProjectHistory::create([
            'project_id' => $project->id,
            'user_id' => $user?->id,
            'action' => $action,
            'description' => $description,
            'meta' => $meta,
        ]);

        $this->auditLogger->log(
            $user,
            $action,
            'projects',
            $description,
        );

        return $entry;
    }

    public function board(Project $project): array
    {
        $tasks = $project->tasks()
            ->with(['assignee:id,name', 'dependencies:id,title,status'])
            ->orderBy('due_date')
            ->get();

        return [
            'pending' => $tasks->where('status', TaskStatus::Pending)->values(),
            'in_progress' => $tasks->where('status', TaskStatus::InProgress)->values(),
            'done' => $tasks->where('status', TaskStatus::Done)->values(),
        ];
    }

    public function updateTaskStatus(
        User $actor,
        Task $task,
        TaskStatus $status,
        Request $request,
    ): Task {
        if ($status === TaskStatus::InProgress && ! $task->canStart()) {
            throw new \InvalidArgumentException(__('messages.tasks.dependencies_blocking'));
        }

        if ($status === TaskStatus::Done && ! $task->canComplete()) {
            throw new \InvalidArgumentException(__('messages.tasks.dependencies_blocking'));
        }

        $previous = $task->status;
        $task->update(['status' => $status]);
        $task->load(['project', 'assignee', 'dependencies']);

        $this->logHistory(
            $task->project,
            $actor,
            'task_status_changed',
            __('messages.projects.history_task_status', [
                'title' => $task->title,
                'from' => $previous->value,
                'to' => $status->value,
            ]),
            ['task_id' => $task->id],
        );

        return $task;
    }

    public function syncDependencies(Task $task, array $dependsOnIds): void
    {
        $dependsOnIds = array_unique(array_filter($dependsOnIds, fn ($id) => (int) $id !== $task->id));

        if ($this->wouldCreateCycle($task->id, $dependsOnIds)) {
            throw new \InvalidArgumentException(__('messages.tasks.dependency_cycle'));
        }

        $task->dependencies()->sync($dependsOnIds);
    }

    private function wouldCreateCycle(int $taskId, array $dependsOnIds): bool
    {
        foreach ($dependsOnIds as $depId) {
            if ($this->dependsTransitivelyOn((int) $depId, $taskId)) {
                return true;
            }
        }

        return false;
    }

    private function dependsTransitivelyOn(int $taskId, int $targetId): bool
    {
        $visited = [];
        $stack = [$taskId];

        while ($stack !== []) {
            $current = array_pop($stack);
            if ($current === $targetId) {
                return true;
            }
            if (in_array($current, $visited, true)) {
                continue;
            }
            $visited[] = $current;

            $deps = DB::table('task_dependencies')
                ->where('task_id', $current)
                ->pluck('depends_on_task_id');

            foreach ($deps as $dep) {
                $stack[] = (int) $dep;
            }
        }

        return false;
    }

    public function createMilestone(User $actor, Project $project, array $data, Request $request): Milestone
    {
        $milestone = Milestone::create([
            'project_id' => $project->id,
            'title' => $data['title'],
            'target_date' => $data['target_date'],
            'status' => MilestoneStatus::Pending,
        ]);

        $this->logHistory(
            $project,
            $actor,
            'milestone_created',
            __('messages.projects.history_milestone', ['title' => $milestone->title]),
            ['milestone_id' => $milestone->id],
        );

        return $milestone;
    }

    public function refreshMilestoneStatuses(): void
    {
        Milestone::query()
            ->where('status', MilestoneStatus::Pending)
            ->whereDate('target_date', '<', Carbon::today())
            ->update(['status' => MilestoneStatus::Missed]);
    }

    public function sendMilestoneReminders(): void
    {
        $cacheKey = 'milestone_reminders_'.Carbon::today()->format('Y-m-d');
        if (Cache::has($cacheKey)) {
            return;
        }

        $this->refreshMilestoneStatuses();

        Milestone::query()
            ->with('project.manager')
            ->where('status', MilestoneStatus::Pending)
            ->whereBetween('target_date', [Carbon::today(), Carbon::today()->addDays(7)])
            ->each(fn (Milestone $m) => $this->notifications->notifyMilestoneDue($m));

        Cache::put($cacheKey, true, Carbon::today()->endOfDay());
    }

    public function statsForDashboard(User $user): array
    {
        $this->sendMilestoneReminders();

        $projectsQuery = Project::query();
        if ($user->role === \App\Enums\UserRole::Employee) {
            $projectsQuery->where(function ($q) use ($user) {
                $q->where('manager_id', $user->id)
                    ->orWhereHas('tasks', fn ($tq) => $tq->where('assigned_to', $user->id));
            });
        }

        $projectIds = (clone $projectsQuery)->pluck('id');

        return [
            'active_projects' => (clone $projectsQuery)->where('status', ProjectStatus::Active)->count(),
            'completed_tasks' => Task::whereIn('project_id', $projectIds)->where('status', TaskStatus::Done)->count(),
            'upcoming_milestones' => Milestone::whereIn('project_id', $projectIds)
                ->where('status', MilestoneStatus::Pending)
                ->whereBetween('target_date', [Carbon::today(), Carbon::today()->addDays(14)])
                ->count(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function exportPlan(Project $project): array
    {
        $project->load(['manager', 'tasks.assignee', 'milestones']);

        return [
            'project' => [
                'title' => $project->title,
                'description' => $project->description,
                'manager' => $project->manager?->name,
                'status' => $project->status->value,
                'start_date' => $project->start_date?->format('Y-m-d'),
                'end_date' => $project->end_date?->format('Y-m-d'),
                'progress_percent' => $project->progressPercent(),
            ],
            'tasks' => $project->tasks->map(fn (Task $t) => [
                'title' => $t->title,
                'status' => $t->status->value,
                'assignee' => $t->assignee?->name,
                'due_date' => $t->due_date?->format('Y-m-d'),
            ])->values()->all(),
            'milestones' => $project->milestones->map(fn (Milestone $m) => [
                'title' => $m->title,
                'target_date' => $m->target_date?->format('Y-m-d'),
                'status' => $m->status->value,
            ])->values()->all(),
        ];
    }
}
