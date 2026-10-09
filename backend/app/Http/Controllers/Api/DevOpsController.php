<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Deployment;
use App\Services\DevOpsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DevOpsController extends Controller
{
    public function __construct(private DevOpsService $devops) {}

    public function deployments(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'environment' => ['nullable', Rule::in(['staging', 'production', 'local'])],
        ]);

        return response()->json([
            'data' => [
                'deployments' => $this->devops->listDeployments($validated['environment'] ?? null),
                'metrics' => $this->devops->metricsForAdmin(),
            ],
        ]);
    }

    public function recordDeployment(Request $request): JsonResponse
    {
        $secret = config('services.deploy_webhook_secret');
        $headerSecret = $request->header('X-Deploy-Secret');
        $isCi = $secret && $headerSecret && hash_equals((string) $secret, (string) $headerSecret);

        $user = $request->user('api');
        if (! $isCi && (! $user || $user->role !== UserRole::Admin)) {
            return response()->json(['message' => __('messages.devops.forbidden')], 403);
        }

        $validated = $request->validate([
            'environment' => ['required', Rule::in(['staging', 'production', 'local'])],
            'status' => ['required', Rule::in(['pending', 'success', 'failed'])],
            'version' => ['nullable', 'string', 'max:80'],
            'image_tag' => ['nullable', 'string', 'max:120'],
            'commit_sha' => ['nullable', 'string', 'max:64'],
            'notes' => ['nullable', 'string'],
            'meta' => ['nullable', 'array'],
        ]);

        $actor = $isCi ? null : $user;
        $validated['triggered_by'] = $isCi ? 'ci' : 'manual';

        $deployment = $this->devops->recordDeployment($validated, $actor, $request);

        return response()->json([
            'message' => __('messages.devops.recorded'),
            'data' => $deployment,
        ], 201);
    }

    public function rollback(Request $request, Deployment $deployment): JsonResponse
    {
        if ($request->user('api')->role !== \App\Enums\UserRole::Admin) {
            return response()->json(['message' => __('messages.devops.forbidden')], 403);
        }

        $result = $this->devops->rollback($request->user('api'), $deployment, $request);

        return response()->json([
            'message' => __('messages.devops.rollback_success'),
            'data' => $result,
        ]);
    }

    public function metrics(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->devops->metricsForAdmin()]);
    }
}
