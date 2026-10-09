<?php

namespace App\Http\Controllers\Api;

use App\Enums\ThemeMode;
use App\Enums\UserRole;
use App\Enums\WorkflowDomain;
use App\Http\Controllers\Controller;
use App\Models\Workflow;
use App\Services\CustomizationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SettingsController extends Controller
{
    public function __construct(private CustomizationService $customization) {}

    public function stats(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->customization->statsForDashboard($request->user('api')),
        ]);
    }

    public function getThemeSettings(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->customization->getThemeSettings($request->user('api')),
        ]);
    }

    public function updateThemeSettings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'theme' => ['required', Rule::in(ThemeMode::values())],
            'primary_color' => ['nullable', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'secondary_color' => ['nullable', 'regex:/^#[0-9A-Fa-f]{6}$/'],
        ]);

        $data = $this->customization->updateThemeSettings(
            $request->user('api'),
            $validated,
            $request,
        );

        return response()->json([
            'message' => __('messages.settings.theme_updated'),
            'data' => $data,
        ]);
    }

    public function getWorkflows(Request $request): JsonResponse
    {
        return response()->json([
            'data' => [
                'workflows' => $this->customization->getWorkflows($request->user('api')),
            ],
        ]);
    }

    public function addWorkflow(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:2000'],
            'steps' => ['required', 'array', 'min:1'],
            'steps.*.order' => ['nullable', 'integer', 'min:1'],
            'steps.*.name' => ['required', 'string', 'max:80'],
            'steps.*.approver_role' => ['nullable', Rule::in(UserRole::values())],
            'steps.*.description' => ['nullable', 'string', 'max:500'],
            'assigned_roles' => ['nullable', 'array'],
            'assigned_roles.*' => [Rule::in(UserRole::values())],
            'domain' => ['nullable', Rule::in(WorkflowDomain::values())],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $workflow = $this->customization->addWorkflow(
            $request->user('api'),
            $validated,
            $request,
        );

        return response()->json([
            'message' => __('messages.settings.workflow_created'),
            'data' => $workflow,
        ], 201);
    }

    public function updateWorkflow(Request $request, Workflow $workflow): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:2000'],
            'steps' => ['sometimes', 'array', 'min:1'],
            'steps.*.order' => ['nullable', 'integer', 'min:1'],
            'steps.*.name' => ['required_with:steps', 'string', 'max:80'],
            'steps.*.approver_role' => ['nullable', Rule::in(UserRole::values())],
            'assigned_roles' => ['nullable', 'array'],
            'assigned_roles.*' => [Rule::in(UserRole::values())],
            'domain' => ['nullable', Rule::in(WorkflowDomain::values())],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $data = $this->customization->updateWorkflow(
            $request->user('api'),
            $workflow,
            $validated,
            $request,
        );

        return response()->json([
            'message' => __('messages.settings.workflow_updated'),
            'data' => $data,
        ]);
    }

    public function getSystemSettings(Request $request): JsonResponse
    {
        return response()->json([
            'data' => [
                'groups' => $this->customization->getSystemSettings($request->user('api')),
            ],
        ]);
    }

    public function updateSystemSetting(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'key' => ['required', 'string', 'max:80'],
            'value' => ['required', 'string', 'max:5000'],
        ]);

        $data = $this->customization->updateSystemSetting(
            $request->user('api'),
            $validated['key'],
            $validated['value'],
            $request,
        );

        return response()->json([
            'message' => __('messages.settings.system_updated'),
            'data' => $data,
        ]);
    }

    public function exportWorkflows(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->customization->exportWorkflows($request->user('api')),
        ]);
    }

    public function customizationHistory(Request $request): JsonResponse
    {
        return response()->json([
            'data' => [
                'logs' => $this->customization->customizationHistory($request->user('api')),
            ],
        ]);
    }

    public function approvalChain(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'domain' => ['required', Rule::in(WorkflowDomain::values())],
        ]);

        return response()->json([
            'data' => [
                'domain' => $validated['domain'],
                'chain' => $this->customization->resolveApprovalChain(
                    $request->user('api'),
                    $validated['domain'],
                ),
            ],
        ]);
    }
}
