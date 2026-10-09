<?php

namespace App\Services;

use App\Enums\AlertSeverity;
use App\Enums\AlertStatus;
use App\Enums\UserRole;
use App\Models\AuditLog;
use App\Models\RolePermission;
use App\Models\SecurityAlert;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SecurityService
{
    public function __construct(
        private AuditAnalyticsService $auditAnalytics,
        private AuditLogger $auditLogger,
        private NotificationService $notifications,
    ) {}

    public function canManage(User $user): bool
    {
        return $user->role === UserRole::Admin;
    }

    public function hasPermission(User $user, string $permission, string $module): bool
    {
        if ($user->role === UserRole::Admin) {
            return true;
        }

        return RolePermission::query()
            ->where('role', $user->role)
            ->where('permission', $permission)
            ->where('module', $module)
            ->exists();
    }

    public function overview(): array
    {
        $since = Carbon::today()->subDays(30);

        $alertsBySeverity = SecurityAlert::query()
            ->where('status', AlertStatus::Open)
            ->select('severity', DB::raw('COUNT(*) as count'))
            ->groupBy('severity')
            ->pluck('count', 'severity')
            ->all();

        $actionsByModule = AuditLog::query()
            ->where('logged_at', '>=', $since)
            ->select('module', DB::raw('COUNT(*) as count'))
            ->groupBy('module')
            ->orderByDesc('count')
            ->limit(10)
            ->get()
            ->map(fn ($row) => [
                'module' => $row->module,
                'count' => (int) $row->count,
            ])
            ->values()
            ->all();

        return [
            'kpis' => $this->auditAnalytics->dashboardKpis(),
            'security_kpis' => $this->securityKpis(),
            'alerts_by_severity' => [
                ['severity' => 'low', 'count' => (int) ($alertsBySeverity['low'] ?? 0)],
                ['severity' => 'medium', 'count' => (int) ($alertsBySeverity['medium'] ?? 0)],
                ['severity' => 'high', 'count' => (int) ($alertsBySeverity['high'] ?? 0)],
            ],
            'actions_by_module' => $actionsByModule,
            'integrity' => $this->auditLogger->verifyChain(200),
        ];
    }

    public function securityKpis(): array
    {
        $since = Carbon::now()->subDay();

        return [
            'active_alerts' => SecurityAlert::where('status', AlertStatus::Open)->count(),
            'failed_logins_24h' => AuditLog::query()
                ->where('action', 'login_failed')
                ->where('logged_at', '>=', $since)
                ->count(),
            'unauthorized_attempts_24h' => AuditLog::query()
                ->where('action', 'forbidden')
                ->where('logged_at', '>=', $since)
                ->count(),
        ];
    }

    public function statsForDashboard(User $user): ?array
    {
        if ($user->role !== UserRole::Admin) {
            return null;
        }

        return $this->securityKpis();
    }

    public function auditLogsQuery(Request $request): Builder
    {
        $query = AuditLog::query()->with('user')->latest('logged_at');
        $this->applyAuditFilters($query, $request);

        return $query;
    }

    public function applyAuditFilters(Builder $query, Request $request): void
    {
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->integer('user_id'));
        }

        if ($request->filled('module')) {
            $query->where('module', $request->string('module'));
        }

        if ($request->filled('action')) {
            $query->where('action', $request->string('action'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('logged_at', '>=', $request->string('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('logged_at', '<=', $request->string('date_to'));
        }

        if ($request->filled('search')) {
            $term = '%'.$request->string('search').'%';
            $query->where(function (Builder $q) use ($term) {
                $q->where('description', 'like', $term)
                    ->orWhere('ip_address', 'like', $term)
                    ->orWhere('action', 'like', $term)
                    ->orWhere('module', 'like', $term)
                    ->orWhereHas('user', fn (Builder $uq) => $uq
                        ->where('name', 'like', $term)
                        ->orWhere('email', 'like', $term));
            });
        }
    }

    public function securityAlertsQuery(Request $request): Builder
    {
        $query = SecurityAlert::query()->latest();

        if ($request->filled('severity')) {
            $query->where('severity', $request->string('severity'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return $query;
    }

    public function addRolePermission(UserRole $role, string $permission, string $module): RolePermission
    {
        return RolePermission::firstOrCreate([
            'role' => $role,
            'permission' => $permission,
            'module' => $module,
        ]);
    }

    public function removeRolePermission(RolePermission $permission): void
    {
        $permission->delete();
    }

    public function listRolePermissions(): array
    {
        return RolePermission::query()
            ->orderBy('role')
            ->orderBy('module')
            ->orderBy('permission')
            ->get()
            ->map(fn (RolePermission $row) => [
                'id' => $row->id,
                'role' => $row->role->value,
                'permission' => $row->permission,
                'module' => $row->module,
            ])
            ->values()
            ->all();
    }

    public function resolveAlert(SecurityAlert $alert, User $resolver): SecurityAlert
    {
        $alert->update([
            'status' => AlertStatus::Resolved,
            'resolved_at' => Carbon::now(),
            'resolved_by' => $resolver->id,
        ]);

        $this->auditLogger->log(
            $resolver,
            'update',
            'security',
            'Resolved security alert #'.$alert->id.': '.$alert->title,
            request(),
        );

        return $alert->fresh(['resolver']);
    }

    public function createAlert(
        string $title,
        string $description,
        AlertSeverity $severity,
        ?string $sourceType = null,
        ?array $meta = null,
    ): SecurityAlert {
        $existing = SecurityAlert::query()
            ->where('status', AlertStatus::Open)
            ->where('source_type', $sourceType)
            ->where('title', $title)
            ->when($meta, fn (Builder $q) => $q->where('meta->fingerprint', $meta['fingerprint'] ?? null))
            ->first();

        if ($existing) {
            return $existing;
        }

        $alert = SecurityAlert::create([
            'title' => $title,
            'description' => $description,
            'severity' => $severity,
            'status' => AlertStatus::Open,
            'source_type' => $sourceType,
            'meta' => $meta,
        ]);

        if ($severity === AlertSeverity::High && $alert->notified_at === null) {
            $this->notifications->notifySecurityAlertToAdmins($description);
            $alert->update(['notified_at' => Carbon::now()]);
        }

        return $alert;
    }

    public function logUnauthorizedAccess(User $user, Request $request, array $requiredRoles): void
    {
        $description = sprintf(
            'Unauthorized access by %s (%s) to %s %s — required: %s',
            $user->name,
            $user->email,
            $request->method(),
            $request->path(),
            implode(', ', $requiredRoles),
        );

        $this->auditLogger->log($user, 'forbidden', 'security', $description, $request);

        $this->createAlert(
            __('messages.security.alerts.unauthorized_title'),
            $description,
            AlertSeverity::Medium,
            'unauthorized_access',
            [
                'fingerprint' => md5($user->id.'|'.$request->path().'|'.Carbon::now()->format('Y-m-d H')),
                'user_id' => $user->id,
                'path' => $request->path(),
            ],
        );
    }

    public function processSuspiciousActivity(): int
    {
        $created = 0;
        $computed = $this->auditAnalytics->securityAlerts();

        foreach ($computed as $item) {
            $severity = match ($item['severity'] ?? 'medium') {
                'high' => AlertSeverity::High,
                'low' => AlertSeverity::Low,
                default => AlertSeverity::Medium,
            };

            $fingerprint = md5(($item['type'] ?? 'unknown').'|'.($item['ip_address'] ?? $item['email'] ?? $item['user_id'] ?? ''));

            $before = SecurityAlert::where('status', AlertStatus::Open)->count();

            $this->createAlert(
                __('messages.security.alert_types.'.$item['type'], ['default' => $item['type']]),
                $item['message'],
                $severity,
                $item['type'],
                array_merge($item, ['fingerprint' => $fingerprint]),
            );

            if (SecurityAlert::where('status', AlertStatus::Open)->count() > $before) {
                $created++;
            }
        }

        return $created;
    }

    public function exportAuditLogs(Request $request): array
    {
        $logs = $this->auditLogsQuery($request)->limit(5000)->get();

        return $logs->map(fn (AuditLog $log) => [
            'id' => $log->id,
            'timestamp' => $log->logged_at?->toIso8601String(),
            'user' => $log->user?->name ?? 'System',
            'email' => $log->user?->email,
            'action' => $log->action,
            'module' => $log->module,
            'description' => $log->description,
            'ip_address' => $log->ip_address,
            'integrity_hash' => $log->integrity_hash,
        ])->values()->all();
    }
}
