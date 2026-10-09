<?php

namespace App\Http\Controllers\Api;

use App\Enums\TaskStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Task\StoreTaskRequest;
use App\Http\Requests\Task\UpdateTaskRequest;
use App\Http\Resources\TaskResource;
use App\Models\Task;
use App\Models\User;
use App\Services\NotificationService;
use App\Services\GamificationService;
use App\Services\ProjectManagementService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TaskController extends Controller
{
    public function __construct(
        private GamificationService $gamification,
        private ProjectManagementService $pm,
        private NotificationService $notifications,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        /** @var User $user */
        $user = $request->user('api');

        $query = Task::query()
            ->with(['project', 'assignee'])
            ->orderBy('due_date');

        if ($this->isEmployeeOnly($user)) {
            $query->where('assigned_to', $user->id);
        }

        $this->applyFilters($query, $request, $user);

        return TaskResource::collection($query->get());
    }

    public function store(StoreTaskRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        if (! $this->canManage($user)) {
            return response()->json(['message' => __('messages.tasks.forbidden')], 403);
        }

        $validated = $request->validated();

        $task = Task::create([
            ...$validated,
            'status' => $validated['status'] ?? TaskStatus::Pending,
        ]);

        if (! empty($validated['dependency_ids'])) {
            $this->pm->syncDependencies($task, $validated['dependency_ids']);
        }

        $task->load(['project', 'assignee', 'dependencies']);

        if ($task->assigned_to) {
            $this->pm->logHistory(
                $task->project,
                $user,
                'task_created',
                __('messages.projects.history_task_created', ['title' => $task->title]),
                ['task_id' => $task->id],
            );
            $this->notifications->notifyTaskAssigned($task);
        }

        return response()->json([
            'message' => __('messages.tasks.created'),
            'data' => new TaskResource($task),
        ], 201);
    }

    public function show(Task $task): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        if (! $this->canAccess($user, $task)) {
            return response()->json(['message' => __('messages.tasks.forbidden')], 403);
        }

        $task->load(['project', 'assignee']);

        return response()->json([
            'data' => new TaskResource($task),
        ]);
    }

    public function update(UpdateTaskRequest $request, Task $task): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        $wasDone = $task->status === TaskStatus::Done;

        if ($this->canManage($user)) {
            $task->update($request->validated());
        } elseif ($this->canEmployeeUpdate($user, $task, $request)) {
            $task->update(['status' => $request->validated('status')]);
        } else {
            return response()->json(['message' => __('messages.tasks.forbidden')], 403);
        }

        $task->load(['project', 'assignee']);

        if (! $wasDone && $task->status === TaskStatus::Done && $task->assigned_to) {
            $this->gamification->onProjectContribution($task->assigned_to, $task->project_id);
        }

        return response()->json([
            'message' => __('messages.tasks.updated'),
            'data' => new TaskResource($task),
        ]);
    }

    public function destroy(Task $task): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        if (! $this->canManage($user)) {
            return response()->json(['message' => __('messages.tasks.forbidden')], 403);
        }

        $task->delete();

        return response()->json([
            'message' => __('messages.tasks.deleted'),
        ]);
    }

    public function complete(Task $task): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        if (! $this->canAccess($user, $task)) {
            return response()->json(['message' => __('messages.tasks.forbidden')], 403);
        }

        if ($this->isEmployeeOnly($user) && ! $task->isAssignedTo($user)) {
            return response()->json(['message' => __('messages.tasks.forbidden')], 403);
        }

        $wasDone = $task->status === TaskStatus::Done;
        $task->update(['status' => TaskStatus::Done]);
        $task->load(['project', 'assignee']);

        if (! $wasDone && $task->assigned_to) {
            $this->gamification->onProjectContribution($task->assigned_to, $task->project_id);
        }

        return response()->json([
            'message' => __('messages.tasks.completed'),
            'data' => new TaskResource($task),
        ]);
    }

    public function updateStatus(Request $request, Task $task): JsonResponse
    {
        $user = $request->user('api');

        $validated = $request->validate([
            'status' => ['required', 'in:'.implode(',', TaskStatus::values())],
        ]);

        if (! $this->canAccess($user, $task) && ! $this->canManage($user)) {
            return response()->json(['message' => __('messages.tasks.forbidden')], 403);
        }

        if ($this->isEmployeeOnly($user) && ! $task->isAssignedTo($user)) {
            return response()->json(['message' => __('messages.tasks.forbidden')], 403);
        }

        try {
            $task = $this->pm->updateTaskStatus(
                $user,
                $task,
                TaskStatus::from($validated['status']),
                $request,
            );
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        if ($task->status === TaskStatus::Done && $task->assigned_to) {
            $this->gamification->onProjectContribution($task->assigned_to, $task->project_id);
        }

        return response()->json([
            'message' => __('messages.tasks.updated'),
            'data' => new TaskResource($task),
        ]);
    }

    private function applyFilters(Builder $query, Request $request, User $user): void
    {
        if ($request->filled('project_id')) {
            $query->where('project_id', $request->integer('project_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('assigned_to') && $this->canManage($user)) {
            $query->where('assigned_to', $request->integer('assigned_to'));
        }

        if ($request->boolean('overdue_only')) {
            $query->where('status', '!=', TaskStatus::Done->value)
                ->whereNotNull('due_date')
                ->whereDate('due_date', '<', now()->toDateString());
        }
    }

    private function canEmployeeUpdate(User $user, Task $task, UpdateTaskRequest $request): bool
    {
        if (! $task->isAssignedTo($user)) {
            return false;
        }

        $validated = $request->validated();

        return count($validated) === 1
            && array_key_exists('status', $validated)
            && in_array($validated['status'], [TaskStatus::InProgress->value, TaskStatus::Done->value], true);
    }

    private function isEmployeeOnly(User $user): bool
    {
        return $user->role === UserRole::Employee;
    }

    private function canManage(User $user): bool
    {
        return $user->hasAnyRole([
            UserRole::Admin->value,
            UserRole::Manager->value,
        ]);
    }

    private function canAccess(User $user, Task $task): bool
    {
        if ($this->canManage($user)) {
            return true;
        }

        return $task->isAssignedTo($user);
    }
}
