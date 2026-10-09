<?php

namespace App\Http\Controllers\Api;

use App\Enums\MilestoneStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Resources\MilestoneResource;
use App\Models\Milestone;
use App\Models\Project;
use App\Models\User;
use App\Services\ProjectManagementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MilestoneController extends Controller
{
    public function __construct(
        private ProjectManagementService $pm,
    ) {}

    public function index(Project $project): JsonResponse
    {
        $user = auth('api')->user();
        if (! $project->isVisibleTo($user)) {
            return response()->json(['message' => __('messages.projects.forbidden')], 403);
        }

        $this->pm->refreshMilestoneStatuses();

        return response()->json([
            'data' => MilestoneResource::collection($project->milestones),
        ]);
    }

    public function store(Request $request, Project $project): JsonResponse
    {
        $user = $request->user('api');
        if (! $this->canManage($user) || ! $project->isVisibleTo($user)) {
            return response()->json(['message' => __('messages.projects.forbidden')], 403);
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'target_date' => ['required', 'date'],
        ]);

        $milestone = $this->pm->createMilestone($user, $project, $validated, $request);

        return response()->json([
            'message' => __('messages.projects.milestone_created'),
            'data' => new MilestoneResource($milestone),
        ], 201);
    }

    public function update(Request $request, Project $project, Milestone $milestone): JsonResponse
    {
        $user = $request->user('api');
        if ($milestone->project_id !== $project->id || ! $this->canManage($user)) {
            return response()->json(['message' => __('messages.projects.forbidden')], 403);
        }

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'target_date' => ['sometimes', 'date'],
            'status' => ['sometimes', 'in:'.implode(',', MilestoneStatus::values())],
        ]);

        $milestone->update($validated);

        return response()->json([
            'message' => __('messages.projects.milestone_updated'),
            'data' => new MilestoneResource($milestone->fresh()),
        ]);
    }

    private function canManage(User $user): bool
    {
        return $user->hasAnyRole([UserRole::Admin->value, UserRole::Manager->value]);
    }
}
