<?php

namespace App\Services;

use App\Enums\ThemeMode;
use App\Enums\UserRole;
use App\Enums\WorkflowDomain;
use App\Models\CustomizationAuditLog;
use App\Models\SystemSetting;
use App\Models\ThemeSetting;
use App\Models\User;
use App\Models\Workflow;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CustomizationService
{
    public function __construct(
        private NotificationService $notifications,
    ) {}

    public function getThemeSettings(User $user): array
    {
        $setting = $this->themeForUser($user);

        return $this->formatTheme($setting);
    }

    public function updateThemeSettings(User $user, array $data, ?Request $request = null): array
    {
        $setting = $this->themeForUser($user);
        $before = $this->formatTheme($setting);

        $setting->update([
            'theme' => $data['theme'],
            'primary_color' => $data['primary_color'] ?? $setting->primary_color,
            'secondary_color' => $data['secondary_color'] ?? $setting->secondary_color,
        ]);

        $after = $this->formatTheme($setting->fresh());
        $this->logCustomization($user, 'theme_updated', 'theme_setting', $setting->id, [
            'before' => $before,
            'after' => $after,
        ], $request);

        $this->notifications->notifyThemeApplied($user, $after['theme']);

        return $after;
    }

    public function getWorkflows(User $user): array
    {
        $query = Workflow::query()
            ->where('is_active', true)
            ->orderBy('domain')
            ->orderBy('title');

        if ($user->role !== UserRole::Admin) {
            $role = $user->role->value;
            $query->where(function ($q) use ($role) {
                $q->whereJsonContains('assigned_roles', $role)
                    ->orWhereJsonLength('assigned_roles', 0);
            });
        }

        return $query->get()->map(fn (Workflow $w) => $this->formatWorkflow($w))->all();
    }

    public function addWorkflow(User $user, array $data, ?Request $request = null): array
    {
        if (! in_array($user->role, [UserRole::Admin, UserRole::Manager], true)) {
            throw ValidationException::withMessages([
                'workflow' => [__('messages.settings.workflow_forbidden')],
            ]);
        }

        $workflow = Workflow::create([
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'steps' => $this->normalizeSteps($data['steps']),
            'assigned_roles' => $data['assigned_roles'] ?? [],
            'domain' => $data['domain'] ?? WorkflowDomain::General->value,
            'is_active' => $data['is_active'] ?? true,
            'created_by' => $user->id,
        ]);

        $formatted = $this->formatWorkflow($workflow);
        $this->logCustomization($user, 'workflow_created', 'workflow', $workflow->id, [
            'workflow' => $formatted,
        ], $request);

        $this->notifications->notifyWorkflowUpdated($user, $workflow->title, 'created');

        return $formatted;
    }

    public function updateWorkflow(User $user, Workflow $workflow, array $data, ?Request $request = null): array
    {
        if (! in_array($user->role, [UserRole::Admin, UserRole::Manager], true)) {
            throw ValidationException::withMessages([
                'workflow' => [__('messages.settings.workflow_forbidden')],
            ]);
        }

        $before = $this->formatWorkflow($workflow);

        $workflow->update([
            'title' => $data['title'] ?? $workflow->title,
            'description' => $data['description'] ?? $workflow->description,
            'steps' => isset($data['steps']) ? $this->normalizeSteps($data['steps']) : $workflow->steps,
            'assigned_roles' => $data['assigned_roles'] ?? $workflow->assigned_roles,
            'domain' => $data['domain'] ?? $workflow->domain,
            'is_active' => $data['is_active'] ?? $workflow->is_active,
        ]);

        $after = $this->formatWorkflow($workflow->fresh());
        $this->logCustomization($user, 'workflow_updated', 'workflow', $workflow->id, [
            'before' => $before,
            'after' => $after,
        ], $request);

        $this->notifications->notifyWorkflowUpdated($user, $workflow->title, 'updated');

        return $after;
    }

    public function getSystemSettings(User $user): array
    {
        $settings = SystemSetting::query()->orderBy('category')->orderBy('key')->get();

        if ($user->role === UserRole::Employee) {
            $settings = $settings->whereIn('category', ['general', 'appearance']);
        }

        return $settings
            ->groupBy('category')
            ->map(fn ($group, $category) => [
                'category' => $category,
                'items' => $group->map(fn (SystemSetting $s) => [
                    'id' => $s->id,
                    'key' => $s->key,
                    'value' => $s->value,
                ])->values()->all(),
            ])
            ->values()
            ->all();
    }

    public function updateSystemSetting(User $user, string $key, string $value, ?Request $request = null): array
    {
        if ($user->role !== UserRole::Admin) {
            throw ValidationException::withMessages([
                'setting' => [__('messages.settings.system_forbidden')],
            ]);
        }

        $setting = SystemSetting::query()->where('key', $key)->firstOrFail();
        $before = $setting->value;
        $setting->update(['value' => $value]);

        $this->logCustomization($user, 'system_setting_updated', 'system_setting', $setting->id, [
            'key' => $key,
            'before' => $before,
            'after' => $value,
        ], $request);

        return [
            'id' => $setting->id,
            'key' => $setting->key,
            'value' => $setting->value,
            'category' => $setting->category,
        ];
    }

    public function exportWorkflows(User $user): array
    {
        return [
            'exported_at' => Carbon::now()->toIso8601String(),
            'workflows' => $this->getWorkflows($user),
        ];
    }

    public function customizationHistory(User $user, int $limit = 25): array
    {
        $query = CustomizationAuditLog::query()->orderByDesc('logged_at')->limit($limit);

        if ($user->role !== UserRole::Admin) {
            $query->where('user_id', $user->id);
        }

        return $query->get()->map(fn (CustomizationAuditLog $log) => [
            'id' => $log->id,
            'action' => $log->action,
            'entity_type' => $log->entity_type,
            'entity_id' => $log->entity_id,
            'changes' => $log->changes,
            'logged_at' => $log->logged_at?->toIso8601String(),
            'user_id' => $log->user_id,
        ])->all();
    }

    /**
     * Resolve approval chain steps for a domain (HR, Finance, etc.).
     */
    public function resolveApprovalChain(User $user, string $domain): array
    {
        $workflow = Workflow::query()
            ->where('is_active', true)
            ->where('domain', $domain)
            ->orderByDesc('updated_at')
            ->get()
            ->first(fn (Workflow $w) => $this->workflowVisibleToUser($w, $user));

        if (! $workflow) {
            return $this->defaultChainForDomain($domain);
        }

        return collect($workflow->steps)
            ->sortBy('order')
            ->values()
            ->map(fn (array $step) => [
                'order' => $step['order'],
                'name' => $step['name'],
                'approver_role' => $step['approver_role'] ?? UserRole::Manager->value,
            ])
            ->all();
    }

    public function statsForDashboard(User $user): array
    {
        $activeWorkflows = Workflow::query()->where('is_active', true)->count();

        if ($user->role !== UserRole::Admin) {
            $role = $user->role->value;
            $activeWorkflows = Workflow::query()
                ->where('is_active', true)
                ->where(function ($q) use ($role) {
                    $q->whereJsonContains('assigned_roles', $role)
                        ->orWhereJsonLength('assigned_roles', 0);
                })
                ->count();
        }

        $customThemes = ThemeSetting::query()
            ->where('theme', ThemeMode::Custom->value)
            ->count();

        $customThemes += ThemeSetting::query()
            ->where('theme', '!=', ThemeMode::Custom->value)
            ->where(function ($q) {
                $q->where('primary_color', '!=', '#4f46e5')
                    ->orWhere('secondary_color', '!=', '#6366f1');
            })
            ->count();

        return [
            'active_workflows' => $activeWorkflows,
            'custom_themes_applied' => $customThemes,
        ];
    }

    private function themeForUser(User $user): ThemeSetting
    {
        return ThemeSetting::firstOrCreate(
            ['user_id' => $user->id],
            [
                'theme' => ThemeMode::Light->value,
                'primary_color' => '#4f46e5',
                'secondary_color' => '#6366f1',
            ],
        );
    }

    private function formatTheme(ThemeSetting $setting): array
    {
        return [
            'theme' => $setting->theme,
            'primary_color' => $setting->primary_color,
            'secondary_color' => $setting->secondary_color,
            'updated_at' => $setting->updated_at?->toIso8601String(),
        ];
    }

    private function formatWorkflow(Workflow $workflow): array
    {
        return [
            'id' => $workflow->id,
            'title' => $workflow->title,
            'description' => $workflow->description,
            'steps' => collect($workflow->steps)->sortBy('order')->values()->all(),
            'assigned_roles' => $workflow->assigned_roles ?? [],
            'domain' => $workflow->domain,
            'is_active' => $workflow->is_active,
            'approval_chain' => $this->resolveApprovalChainFromWorkflow($workflow),
            'created_at' => $workflow->created_at?->toIso8601String(),
            'updated_at' => $workflow->updated_at?->toIso8601String(),
        ];
    }

    private function resolveApprovalChainFromWorkflow(Workflow $workflow): array
    {
        return collect($workflow->steps)
            ->sortBy('order')
            ->values()
            ->map(fn (array $step) => [
                'order' => $step['order'],
                'name' => $step['name'],
                'approver_role' => $step['approver_role'] ?? UserRole::Manager->value,
            ])
            ->all();
    }

    private function workflowVisibleToUser(Workflow $workflow, User $user): bool
    {
        if ($user->role === UserRole::Admin) {
            return true;
        }

        $roles = $workflow->assigned_roles ?? [];

        return $roles === [] || in_array($user->role->value, $roles, true);
    }

    private function normalizeSteps(array $steps): array
    {
        return collect($steps)
            ->values()
            ->map(fn (array $step, int $index) => [
                'order' => $step['order'] ?? $index + 1,
                'name' => $step['name'] ?? 'Step '.($index + 1),
                'approver_role' => $step['approver_role'] ?? UserRole::Manager->value,
                'description' => $step['description'] ?? null,
            ])
            ->sortBy('order')
            ->values()
            ->all();
    }

    private function defaultChainForDomain(string $domain): array
    {
        return match ($domain) {
            WorkflowDomain::Hr->value => [
                ['order' => 1, 'name' => 'Employee submission', 'approver_role' => UserRole::Employee->value],
                ['order' => 2, 'name' => 'HR manager review', 'approver_role' => UserRole::Manager->value],
                ['order' => 3, 'name' => 'HR admin approval', 'approver_role' => UserRole::Admin->value],
            ],
            WorkflowDomain::Finance->value => [
                ['order' => 1, 'name' => 'Requester', 'approver_role' => UserRole::Employee->value],
                ['order' => 2, 'name' => 'Finance manager', 'approver_role' => UserRole::Manager->value],
                ['order' => 3, 'name' => 'Finance director', 'approver_role' => UserRole::Admin->value],
            ],
            default => [
                ['order' => 1, 'name' => 'Submit', 'approver_role' => UserRole::Employee->value],
                ['order' => 2, 'name' => 'Manager approval', 'approver_role' => UserRole::Manager->value],
            ],
        };
    }

    private function logCustomization(
        User $user,
        string $action,
        string $entityType,
        ?int $entityId,
        array $changes,
        ?Request $request = null,
    ): void {
        CustomizationAuditLog::create([
            'user_id' => $user->id,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'changes' => $changes,
            'logged_at' => Carbon::now(),
        ]);

        app(AuditLogger::class)->log(
            $user,
            $action,
            'customization',
            "{$entityType}#{$entityId}",
            $request,
        );
    }
}
