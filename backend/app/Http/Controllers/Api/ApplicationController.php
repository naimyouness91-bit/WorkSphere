<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Application\StoreApplicationRequest;
use App\Http\Requests\Application\UpdateApplicationRequest;
use App\Http\Resources\ApplicationResource;
use App\Enums\ApplicationStatus;
use App\Models\Application;
use App\Models\Job;
use App\Models\User;
use App\Services\RecruitmentService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ApplicationController extends Controller
{
    public function __construct(
        private RecruitmentService $recruitment,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        /** @var User $user */
        $user = $request->user('api');

        $query = Application::query()
            ->with('job')
            ->orderByDesc('created_at');

        if ($this->isEmployeeOnly($user)) {
            $query->where(function (Builder $q) use ($user) {
                $q->where('user_id', $user->id)
                    ->orWhere('candidate_email', $user->email);
            });
        }

        $this->applyFilters($query, $request);

        return ApplicationResource::collection($query->get());
    }

    public function store(StoreApplicationRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');
        $file = $request->file('resume');
        $validated = $request->validated();

        $path = $file->store('applications/'.$validated['job_id'], 'public');

        $application = Application::create([
            'job_id' => $validated['job_id'],
            'user_id' => $user->id,
            'candidate_name' => $validated['candidate_name'],
            'candidate_email' => $validated['candidate_email'],
            'resume_path' => $path,
            'original_resume_filename' => $file->getClientOriginalName(),
            'status' => ApplicationStatus::Applied,
        ]);

        $this->recruitment->afterLegacyApplicationCreated($user, $application);
        $application->load('job');

        return response()->json([
            'message' => __('messages.applications.submitted'),
            'data' => new ApplicationResource($application),
        ], 201);
    }

    public function show(Application $application): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        if (! $this->canAccess($user, $application)) {
            return response()->json(['message' => __('messages.applications.forbidden')], 403);
        }

        $application->load('job');

        return response()->json([
            'data' => new ApplicationResource($application),
        ]);
    }

    public function update(UpdateApplicationRequest $request, Application $application): JsonResponse
    {
        if (! $this->canManage(auth('api')->user())) {
            return response()->json(['message' => __('messages.applications.forbidden')], 403);
        }

        $application->update($request->validated());
        $application->load('job');

        return response()->json([
            'message' => __('messages.applications.updated'),
            'data' => new ApplicationResource($application),
        ]);
    }

    public function destroy(Application $application): JsonResponse
    {
        if (! $this->canManage(auth('api')->user())) {
            return response()->json(['message' => __('messages.applications.forbidden')], 403);
        }

        if (Storage::disk('public')->exists($application->resume_path)) {
            Storage::disk('public')->delete($application->resume_path);
        }

        $application->delete();

        return response()->json([
            'message' => __('messages.applications.deleted'),
        ]);
    }

    public function downloadResume(Application $application): StreamedResponse|JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        if (! $this->canAccess($user, $application)) {
            return response()->json(['message' => __('messages.applications.forbidden')], 403);
        }

        if (! Storage::disk('public')->exists($application->resume_path)) {
            return response()->json(['message' => __('messages.applications.resume_missing')], 404);
        }

        return Storage::disk('public')->download(
            $application->resume_path,
            $application->original_resume_filename,
        );
    }

    private function applyFilters(Builder $query, Request $request): void
    {
        if ($request->filled('job_id')) {
            $query->where('job_id', $request->integer('job_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('department') && $this->canManage($request->user('api'))) {
            $department = $request->string('department');
            $query->whereHas('job', fn (Builder $q) => $q->where('department', $department));
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

    private function canAccess(User $user, Application $application): bool
    {
        if ($this->canManage($user)) {
            return true;
        }

        return $application->isOwnedBy($user);
    }
}
