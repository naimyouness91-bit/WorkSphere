<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Recruitment\StoreCandidateRequest;
use App\Http\Requests\Recruitment\StoreJobPostingRequest;
use App\Http\Requests\Recruitment\UpdateCandidateStatusRequest;
use App\Http\Resources\CandidateResource;
use App\Http\Resources\JobPostingResource;
use App\Http\Resources\OnboardingTaskResource;
use App\Models\Candidate;
use App\Models\OnboardingTask;
use App\Models\User;
use App\Services\RecruitmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class RecruitmentController extends Controller
{
    public function __construct(
        private RecruitmentService $recruitment,
    ) {}

    public function overview(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        return response()->json([
            'data' => $this->recruitment->overview($user),
        ]);
    }

    public function getJobPostings(Request $request): AnonymousResourceCollection
    {
        $postings = $this->recruitment->getActiveJobPostings(
            $request->filled('department') ? $request->string('department')->toString() : null,
            $request->filled('status') ? $request->string('status')->toString() : null,
        );

        return JobPostingResource::collection($postings);
    }

    public function addJobPosting(StoreJobPostingRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        if (! $this->recruitment->canManage($user)) {
            return response()->json(['message' => __('messages.recruitment.forbidden')], 403);
        }

        $posting = $this->recruitment->addJobPosting($user, $request->validated());

        return response()->json([
            'message' => __('messages.recruitment.job_created'),
            'data' => new JobPostingResource($posting),
        ], 201);
    }

    public function getCandidates(Request $request): AnonymousResourceCollection
    {
        $query = Candidate::query()
            ->with('jobPosting:id,title,department,status')
            ->orderByDesc('created_at');

        if ($request->filled('job_id')) {
            $query->where('job_id', $request->integer('job_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return CandidateResource::collection($query->get());
    }

    public function applyCandidate(StoreCandidateRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        $candidate = $this->recruitment->applyCandidate(
            $user,
            $request->validated(),
            $request->file('resume'),
        );

        return response()->json([
            'message' => __('messages.recruitment.candidate_applied'),
            'data' => new CandidateResource($candidate),
        ], 201);
    }

    public function updateCandidateStatus(UpdateCandidateStatusRequest $request, Candidate $candidate): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        if (! $this->recruitment->canManage($user)) {
            return response()->json(['message' => __('messages.recruitment.forbidden')], 403);
        }

        $candidate = $this->recruitment->updateCandidateStatus(
            $user,
            $candidate,
            $request->string('status')->toString(),
        );

        return response()->json([
            'message' => __('messages.recruitment.status_updated'),
            'data' => new CandidateResource($candidate),
        ]);
    }

    public function getOnboardingTasks(Request $request): AnonymousResourceCollection
    {
        /** @var User $user */
        $user = $request->user('api');

        $employeeId = $request->integer('employee_id') ?: null;
        if (! $this->recruitment->canManage($user)) {
            $employeeId = $user->id;
        }

        $tasks = $this->recruitment->getOnboardingTasks($employeeId);

        return OnboardingTaskResource::collection($tasks);
    }

    public function completeOnboardingTask(Request $request, OnboardingTask $onboardingTask): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        if (! $this->recruitment->canManage($user) && $onboardingTask->employee_id !== $user->id) {
            return response()->json(['message' => __('messages.recruitment.forbidden')], 403);
        }

        $task = $this->recruitment->completeOnboardingTask($user, $onboardingTask);

        return response()->json([
            'message' => __('messages.recruitment.task_completed'),
            'data' => new OnboardingTaskResource($task),
        ]);
    }

    public function exportCandidates(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        if (! $this->recruitment->canManage($user)) {
            return response()->json(['message' => __('messages.recruitment.forbidden')], 403);
        }

        return response()->json([
            'data' => $this->recruitment->exportCandidates(
                $request->filled('job_id') ? $request->integer('job_id') : null,
            ),
        ]);
    }

    public function previewResume(Candidate $candidate): StreamedResponse|JsonResponse
    {
        if (! Storage::disk('public')->exists($candidate->resume_path)) {
            return response()->json(['message' => __('messages.recruitment.resume_missing')], 404);
        }

        $mime = Storage::disk('public')->mimeType($candidate->resume_path) ?? 'application/octet-stream';

        if (! str_contains($mime, 'pdf')) {
            return response()->json(['message' => __('messages.recruitment.preview_pdf_only')], 422);
        }

        return response()->file(
            Storage::disk('public')->path($candidate->resume_path),
            ['Content-Type' => 'application/pdf'],
        );
    }

    public function downloadResume(Candidate $candidate): StreamedResponse|JsonResponse
    {
        if (! Storage::disk('public')->exists($candidate->resume_path)) {
            return response()->json(['message' => __('messages.recruitment.resume_missing')], 404);
        }

        return Storage::disk('public')->download(
            $candidate->resume_path,
            $candidate->original_resume_filename,
        );
    }

    public function history(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        if (! $this->recruitment->canManage($user)) {
            return response()->json(['message' => __('messages.recruitment.forbidden')], 403);
        }

        $items = $this->recruitment->history(min((int) $request->query('limit', 50), 100));

        return response()->json([
            'data' => $items->map(fn ($h) => [
                'id' => $h->id,
                'action' => $h->action,
                'entity_type' => $h->entity_type,
                'description' => $h->description,
                'meta' => $h->meta,
                'actor' => $h->actor ? ['id' => $h->actor->id, 'name' => $h->actor->name] : null,
                'occurred_at' => $h->occurred_at?->toIso8601String(),
            ]),
        ]);
    }
}
