<?php

namespace App\Http\Controllers\Api;

use App\Enums\ProjectStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Project\StoreProjectRequest;
use App\Http\Requests\Project\UpdateProjectRequest;
use App\Http\Resources\ProjectResource;
use App\Models\Project;
use App\Models\User;
use App\Services\GamificationService;
use App\Services\ProjectManagementService;
use App\Http\Resources\TaskResource;
use App\Http\Resources\MilestoneResource;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProjectController extends Controller
{
    public function __construct(
        private GamificationService $gamification,
        private ProjectManagementService $pm,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        /** @var User $user */
        $user = $request->user('api');

        $query = Project::query()
            ->with(['manager'])
            ->withCount([
                'tasks',
                'tasks as completed_tasks_count' => fn (Builder $q) => $q->where('status', 'done'),
            ])
            ->orderByDesc('created_at');

        if ($this->isEmployeeOnly($user)) {
            $query->where(function (Builder $q) use ($user) {
                $q->where('manager_id', $user->id)
                    ->orWhereHas('tasks', fn (Builder $tq) => $tq->where('assigned_to', $user->id));
            });
        }

        $this->applyFilters($query, $request);

        return ProjectResource::collection($query->get());
    }

    public function store(StoreProjectRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        if (! $this->canManage($user)) {
            return response()->json(['message' => __('messages.projects.forbidden')], 403);
        }

        $validated = $request->validated();

        $project = Project::create([
            ...$validated,
            'status' => $validated['status'] ?? ProjectStatus::Active,
        ]);

        $project->load(['manager']);
        $project->loadCount([
            'tasks',
            'tasks as completed_tasks_count' => fn (Builder $q) => $q->where('status', 'done'),
        ]);

        if ($project->manager_id) {
            $this->gamification->onProjectContribution($project->manager_id, $project->id);
        }

        return response()->json([
            'message' => __('messages.projects.created'),
            'data' => new ProjectResource($project),
        ], 201);
    }

    public function show(Project $project): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        if (! $project->isVisibleTo($user)) {
            return response()->json(['message' => __('messages.projects.forbidden')], 403);
        }

        $project->load(['manager', 'tasks.assignee']);
        $project->loadCount([
            'tasks',
            'tasks as completed_tasks_count' => fn (Builder $q) => $q->where('status', 'done'),
        ]);

        return response()->json([
            'data' => new ProjectResource($project),
        ]);
    }

    public function update(UpdateProjectRequest $request, Project $project): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        if (! $this->canManage($user)) {
            return response()->json(['message' => __('messages.projects.forbidden')], 403);
        }

        $project->update($request->validated());
        $project->load(['manager']);
        $project->loadCount([
            'tasks',
            'tasks as completed_tasks_count' => fn (Builder $q) => $q->where('status', 'done'),
        ]);

        return response()->json([
            'message' => __('messages.projects.updated'),
            'data' => new ProjectResource($project),
        ]);
    }

    public function destroy(Project $project): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        if (! $this->canManage($user)) {
            return response()->json(['message' => __('messages.projects.forbidden')], 403);
        }

        $project->delete();

        return response()->json([
            'message' => __('messages.projects.deleted'),
        ]);
    }

    public function board(Project $project): JsonResponse
    {
        $user = auth('api')->user();
        if (! $project->isVisibleTo($user)) {
            return response()->json(['message' => __('messages.projects.forbidden')], 403);
        }

        $board = $this->pm->board($project);

        return response()->json([
            'data' => [
                'pending' => TaskResource::collection($board['pending']),
                'in_progress' => TaskResource::collection($board['in_progress']),
                'done' => TaskResource::collection($board['done']),
            ],
        ]);
    }

    public function history(Project $project): JsonResponse
    {
        $user = auth('api')->user();
        if (! $project->isVisibleTo($user)) {
            return response()->json(['message' => __('messages.projects.forbidden')], 403);
        }

        $entries = $project->history()->with('user:id,name')->limit(50)->get();

        return response()->json([
            'data' => $entries->map(fn ($h) => [
                'id' => $h->id,
                'action' => $h->action,
                'description' => $h->description,
                'user_name' => $h->user?->name,
                'meta' => $h->meta,
                'created_at' => $h->created_at?->toIso8601String(),
            ]),
        ]);
    }

    public function exportPlan(Project $project): JsonResponse
    {
        $user = auth('api')->user();
        if (! $project->isVisibleTo($user)) {
            return response()->json(['message' => __('messages.projects.forbidden')], 403);
        }

        return response()->json(['data' => $this->pm->exportPlan($project)]);
    }

    public function overview(Request $request, Project $project): JsonResponse
    {
        $user = $request->user('api');
        if (! $project->isVisibleTo($user)) {
            return response()->json(['message' => __('messages.projects.forbidden')], 403);
        }

        $this->pm->sendMilestoneReminders();
        $project->load(['manager', 'milestones']);
        $project->loadCount([
            'tasks',
            'tasks as completed_tasks_count' => fn (Builder $q) => $q->where('status', 'done'),
        ]);

        $board = $this->pm->board($project);

        return response()->json([
            'data' => [
                'project' => new ProjectResource($project),
                'board' => [
                    'pending' => TaskResource::collection($board['pending'])->resolve(),
                    'in_progress' => TaskResource::collection($board['in_progress'])->resolve(),
                    'done' => TaskResource::collection($board['done'])->resolve(),
                ],
                'milestones' => MilestoneResource::collection($project->milestones)->resolve(),
            ],
        ]);
    }

    private function applyFilters(Builder $query, Request $request): void
    {
        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('manager_id') && $this->canManage($request->user('api'))) {
            $query->where('manager_id', $request->integer('manager_id'));
        }

        if ($request->filled('search')) {
            $search = '%'.$request->string('search').'%';
            $query->where('title', 'like', $search);
        }
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
}
