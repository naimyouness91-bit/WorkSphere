<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Resources\AuditLogResource;
use App\Http\Resources\SecurityAlertResource;
use App\Models\SecurityAlert;
use App\Models\User;
use App\Services\AuditAnalyticsService;
use App\Services\SecurityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class SecurityController extends Controller
{
    public function __construct(
        private SecurityService $security,
        private AuditAnalyticsService $auditAnalytics,
    ) {}

    public function overview(Request $request): JsonResponse
    {
        if (! $this->security->canManage($request->user('api'))) {
            return response()->json(['message' => __('messages.security.forbidden')], 403);
        }

        return response()->json(['data' => $this->security->overview()]);
    }

    public function auditLogs(Request $request): AnonymousResourceCollection|JsonResponse
    {
        if (! $this->security->canManage($request->user('api'))) {
            return response()->json(['message' => __('messages.security.forbidden')], 403);
        }

        return AuditLogResource::collection(
            $this->security->auditLogsQuery($request)->paginate(50),
        );
    }

    public function showAuditLog(Request $request, int $auditLog): JsonResponse
    {
        if (! $this->security->canManage($request->user('api'))) {
            return response()->json(['message' => __('messages.security.forbidden')], 403);
        }

        $log = \App\Models\AuditLog::query()->with('user')->findOrFail($auditLog);

        return response()->json(['data' => new AuditLogResource($log)]);
    }

    public function alerts(Request $request): JsonResponse
    {
        if (! $this->security->canManage($request->user('api'))) {
            return response()->json(['message' => __('messages.security.forbidden')], 403);
        }

        $alerts = $this->security->securityAlertsQuery($request)->paginate(30);

        return SecurityAlertResource::collection($alerts);
    }

    public function resolveAlert(Request $request, SecurityAlert $securityAlert): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        if (! $this->security->canManage($user)) {
            return response()->json(['message' => __('messages.security.forbidden')], 403);
        }

        if ($securityAlert->status === \App\Enums\AlertStatus::Resolved) {
            return response()->json(['message' => __('messages.security.already_resolved')], 422);
        }

        $alert = $this->security->resolveAlert($securityAlert, $user);

        return response()->json([
            'message' => __('messages.security.alert_resolved'),
            'data' => new SecurityAlertResource($alert),
        ]);
    }

    public function permissions(Request $request): JsonResponse
    {
        if (! $this->security->canManage($request->user('api'))) {
            return response()->json(['message' => __('messages.security.forbidden')], 403);
        }

        return response()->json(['data' => $this->security->listRolePermissions()]);
    }

    public function addPermission(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        if (! $this->security->canManage($user)) {
            return response()->json(['message' => __('messages.security.forbidden')], 403);
        }

        $validated = $request->validate([
            'role' => ['required', Rule::in(UserRole::values())],
            'permission' => ['required', 'string', 'max:80'],
            'module' => ['required', 'string', 'max:60'],
        ]);

        $permission = $this->security->addRolePermission(
            UserRole::from($validated['role']),
            $validated['permission'],
            $validated['module'],
        );

        return response()->json([
            'message' => __('messages.security.permission_added'),
            'data' => [
                'id' => $permission->id,
                'role' => $permission->role->value,
                'permission' => $permission->permission,
                'module' => $permission->module,
            ],
        ], 201);
    }

    public function removePermission(Request $request, int $permission): JsonResponse
    {
        if (! $this->security->canManage($request->user('api'))) {
            return response()->json(['message' => __('messages.security.forbidden')], 403);
        }

        $row = \App\Models\RolePermission::findOrFail($permission);
        $this->security->removeRolePermission($row);

        return response()->json(['message' => __('messages.security.permission_removed')]);
    }

    public function export(Request $request): JsonResponse
    {
        if (! $this->security->canManage($request->user('api'))) {
            return response()->json(['message' => __('messages.security.forbidden')], 403);
        }

        return response()->json([
            'data' => $this->security->exportAuditLogs($request),
        ]);
    }

    public function verifyIntegrity(Request $request): JsonResponse
    {
        if (! $this->security->canManage($request->user('api'))) {
            return response()->json(['message' => __('messages.security.forbidden')], 403);
        }

        return response()->json([
            'data' => app(\App\Services\AuditLogger::class)->verifyChain(
                $request->integer('limit') ?: 500,
            ),
        ]);
    }

    public function summary(Request $request): JsonResponse
    {
        if (! $this->security->canManage($request->user('api'))) {
            return response()->json(['message' => __('messages.security.forbidden')], 403);
        }

        return response()->json([
            'data' => [
                'kpis' => $this->auditAnalytics->dashboardKpis(),
                'security_kpis' => $this->security->securityKpis(),
                'alerts' => $this->auditAnalytics->securityAlerts(),
            ],
        ]);
    }
}
