<?php

namespace App\Http\Controllers\Api;

use App\Enums\JobStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Job\StoreJobRequest;
use App\Http\Requests\Job\UpdateJobRequest;
use App\Http\Resources\JobResource;
use App\Models\Job;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class JobController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        /** @var User $user */
        $user = $request->user('api');

        $query = Job::query()
            ->withCount('applications')
            ->orderByDesc('created_at');

        if ($this->isEmployeeOnly($user)) {
            $query->where('status', JobStatus::Open);
        }

        $this->applyFilters($query, $request);

        return JobResource::collection($query->get());
    }

    public function store(StoreJobRequest $request): JsonResponse
    {
        if (! $this->canManage($request->user('api'))) {
            return response()->json(['message' => __('messages.jobs.forbidden')], 403);
        }

        $job = Job::create([
            ...$request->validated(),
            'status' => $request->validated()['status'] ?? JobStatus::Open,
        ]);

        return response()->json([
            'message' => __('messages.jobs.created'),
            'data' => new JobResource($job),
        ], 201);
    }

    public function show(Job $job): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        if ($this->isEmployeeOnly($user) && $job->status !== JobStatus::Open) {
            return response()->json(['message' => __('messages.jobs.forbidden')], 403);
        }

        $job->loadCount('applications');

        return response()->json([
            'data' => new JobResource($job),
        ]);
    }

    public function update(UpdateJobRequest $request, Job $job): JsonResponse
    {
        if (! $this->canManage($request->user('api'))) {
            return response()->json(['message' => __('messages.jobs.forbidden')], 403);
        }

        $job->update($request->validated());
        $job->loadCount('applications');

        return response()->json([
            'message' => __('messages.jobs.updated'),
            'data' => new JobResource($job),
        ]);
    }

    public function destroy(Job $job): JsonResponse
    {
        if (! $this->canManage(auth('api')->user())) {
            return response()->json(['message' => __('messages.jobs.forbidden')], 403);
        }

        $job->delete();

        return response()->json([
            'message' => __('messages.jobs.deleted'),
        ]);
    }

    private function applyFilters(Builder $query, Request $request): void
    {
        if ($request->filled('status') && $this->canManage($request->user('api'))) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('department')) {
            $query->where('department', $request->string('department'));
        }
    }

    private function isEmployeeOnly(User $user): bool
    {
        return $user->role === UserRole::Employee;
    }

    private function canManage(?User $user): bool
    {
        return $user && $user->hasAnyRole([
            UserRole::Admin->value,
            UserRole::Manager->value,
        ]);
    }
}
