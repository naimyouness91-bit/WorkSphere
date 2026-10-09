<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Skill\StoreSkillRequest;
use App\Http\Requests\Skill\UpdateSkillRequest;
use App\Http\Resources\SkillResource;
use App\Models\Skill;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SkillController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        /** @var User $user */
        $user = $request->user('api');

        $query = Skill::query()
            ->with('employee')
            ->orderBy('name');

        if ($this->isEmployeeOnly($user)) {
            $query->where('employee_id', $user->id);
        }

        $this->applyFilters($query, $request);

        return SkillResource::collection($query->get());
    }

    public function store(StoreSkillRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        if (! $this->canManageSkills($user)) {
            return response()->json(['message' => __('messages.skills.forbidden')], 403);
        }

        $skill = Skill::create($request->validated());
        $skill->load('employee');

        return response()->json([
            'message' => __('messages.skills.created'),
            'data' => new SkillResource($skill),
        ], 201);
    }

    public function show(Skill $skill): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        if (! $this->canAccess($user, $skill)) {
            return response()->json(['message' => __('messages.skills.forbidden')], 403);
        }

        $skill->load('employee');

        return response()->json([
            'data' => new SkillResource($skill),
        ]);
    }

    public function update(UpdateSkillRequest $request, Skill $skill): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        if (! $this->canManageSkills($user)) {
            return response()->json(['message' => __('messages.skills.forbidden')], 403);
        }

        $skill->update($request->validated());
        $skill->load('employee');

        return response()->json([
            'message' => __('messages.skills.updated'),
            'data' => new SkillResource($skill),
        ]);
    }

    public function destroy(Skill $skill): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        if (! $this->canManageSkills($user)) {
            return response()->json(['message' => __('messages.skills.forbidden')], 403);
        }

        $skill->delete();

        return response()->json([
            'message' => __('messages.skills.deleted'),
        ]);
    }

    private function applyFilters(Builder $query, Request $request): void
    {
        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->integer('employee_id'));
        }

        if ($request->filled('level')) {
            $query->where('level', $request->string('level'));
        }
    }

    private function isEmployeeOnly(User $user): bool
    {
        return $user->role === UserRole::Employee;
    }

    private function canManageSkills(User $user): bool
    {
        return $user->hasAnyRole([
            UserRole::Admin->value,
            UserRole::Manager->value,
        ]);
    }

    private function canAccess(User $user, Skill $skill): bool
    {
        if ($this->canManageSkills($user)) {
            return true;
        }

        return $skill->isOwnedBy($user);
    }
}
