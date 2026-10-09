<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Compliance\StorePolicyRequest;
use App\Http\Resources\PolicyResource;
use App\Models\Policy;
use App\Models\User;
use App\Services\ComplianceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PolicyController extends Controller
{
    public function __construct(
        private ComplianceService $compliance,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $currentOnly = $request->boolean('current_only', true);

        $query = Policy::query()->with('creator:id,name')->orderByDesc('effective_date');

        if ($currentOnly) {
            $query->where('is_current', true);
        }

        return PolicyResource::collection($query->get());
    }

    public function store(StorePolicyRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        if (! $this->canManage($user)) {
            return response()->json(['message' => __('messages.compliance.forbidden')], 403);
        }

        $policy = $this->compliance->uploadPolicy(
            $user,
            $request->validated(),
            $request->file('file'),
        );

        $policy->load('creator:id,name');

        return response()->json([
            'message' => __('messages.compliance.policy_uploaded'),
            'data' => new PolicyResource($policy),
        ], 201);
    }

    public function versions(Policy $policy): JsonResponse
    {
        $versions = Policy::versionsForCode($policy->code)->with('creator:id,name')->get();

        return response()->json([
            'data' => PolicyResource::collection($versions),
        ]);
    }

    public function download(Policy $policy): StreamedResponse|JsonResponse
    {
        if (! Storage::disk('local')->exists($policy->file_path)) {
            return response()->json(['message' => __('messages.compliance.file_missing')], 404);
        }

        return Storage::disk('local')->download($policy->file_path, $policy->original_filename);
    }

    public function preview(Policy $policy): StreamedResponse|JsonResponse
    {
        if ($policy->mime_type !== 'application/pdf') {
            return $this->download($policy);
        }

        if (! Storage::disk('local')->exists($policy->file_path)) {
            return response()->json(['message' => __('messages.compliance.file_missing')], 404);
        }

        return response()->file(
            Storage::disk('local')->path($policy->file_path),
            ['Content-Type' => 'application/pdf'],
        );
    }

    private function canManage(User $user): bool
    {
        return $user->hasAnyRole([
            UserRole::Admin->value,
            UserRole::Manager->value,
        ]);
    }
}
