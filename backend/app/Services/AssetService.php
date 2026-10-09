<?php

namespace App\Services;

use App\Enums\AssetStatus;
use App\Enums\UserRole;
use App\Models\Asset;
use App\Models\AssetAssignment;
use App\Models\AssetMaintenance;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class AssetService
{
    public function __construct(
        private AuditLogger $auditLogger,
        private NotificationService $notifications,
    ) {}

    public function createAsset(User $actor, array $data, Request $request): Asset
    {
        $asset = Asset::create([
            'name' => $data['name'],
            'type' => $data['type'],
            'serial_number' => $data['serial_number'] ?? null,
            'purchase_date' => $data['purchase_date'] ?? null,
            'status' => $data['status'] ?? AssetStatus::Active,
            'qr_token' => (string) Str::uuid(),
            'notes' => $data['notes'] ?? null,
        ]);

        $this->auditLogger->log(
            $actor,
            'asset_created',
            'assets',
            __('messages.assets.audit_created', ['name' => $asset->name]),
            $request,
        );

        return $asset;
    }

    public function assignAsset(User $actor, Asset $asset, array $data, Request $request): AssetAssignment
    {
        if ($asset->isAssigned()) {
            throw new \InvalidArgumentException(__('messages.assets.already_assigned'));
        }

        if ($asset->status === AssetStatus::Maintenance) {
            throw new \InvalidArgumentException(__('messages.assets.in_maintenance'));
        }

        $assignment = AssetAssignment::create([
            'asset_id' => $asset->id,
            'employee_id' => $data['employee_id'],
            'assigned_date' => $data['assigned_date'] ?? Carbon::today(),
            'expected_return_date' => $data['expected_return_date'] ?? null,
            'notes' => $data['notes'] ?? null,
        ]);

        $asset->update(['status' => AssetStatus::Active]);

        $assignment->load('employee:id,name,email');

        $this->auditLogger->log(
            $actor,
            'asset_assigned',
            'assets',
            __('messages.assets.audit_assigned', [
                'name' => $asset->name,
                'employee' => $assignment->employee?->name ?? '',
            ]),
            $request,
        );

        $this->notifications->notifyAssetAssigned($assignment);

        return $assignment;
    }

    public function returnAsset(User $actor, Asset $asset, Request $request, ?string $returnDate = null): AssetAssignment
    {
        $assignment = $asset->assignments()->whereNull('return_date')->first();

        if (! $assignment) {
            throw new \InvalidArgumentException(__('messages.assets.not_assigned'));
        }

        $assignment->update(['return_date' => $returnDate ?? Carbon::today()]);

        $this->auditLogger->log(
            $actor,
            'asset_returned',
            'assets',
            __('messages.assets.audit_returned', ['name' => $asset->name]),
            $request,
        );

        return $assignment->fresh(['employee:id,name']);
    }

    public function scheduleMaintenance(User $actor, Asset $asset, array $data, Request $request): AssetMaintenance
    {
        $maintenance = AssetMaintenance::create([
            'asset_id' => $asset->id,
            'description' => $data['description'],
            'scheduled_date' => $data['scheduled_date'],
        ]);

        $asset->update(['status' => AssetStatus::Maintenance]);

        $this->auditLogger->log(
            $actor,
            'asset_maintenance_scheduled',
            'assets',
            __('messages.assets.audit_maintenance', [
                'name' => $asset->name,
                'date' => $maintenance->scheduled_date->format('Y-m-d'),
            ]),
            $request,
        );

        $this->notifications->notifyMaintenanceScheduled($maintenance);

        return $maintenance;
    }

    public function completeMaintenance(User $actor, AssetMaintenance $maintenance, Request $request): AssetMaintenance
    {
        $maintenance->update(['completed_date' => Carbon::today()]);
        $asset = $maintenance->asset;

        $hasPending = $asset->maintenances()->whereNull('completed_date')->exists();
        if (! $hasPending && $asset->status === AssetStatus::Maintenance) {
            $asset->update(['status' => AssetStatus::Active]);
        }

        $this->auditLogger->log(
            $actor,
            'asset_maintenance_completed',
            'assets',
            __('messages.assets.audit_maintenance_done', ['name' => $asset->name]),
            $request,
        );

        return $maintenance->fresh();
    }

    /**
     * @return array{assignments: array, maintenances: array}
     */
    public function history(Asset $asset): array
    {
        $asset->load([
            'assignments.employee:id,name,email',
            'maintenances',
        ]);

        return [
            'assignments' => $asset->assignments->map(fn (AssetAssignment $a) => [
                'id' => $a->id,
                'employee_id' => $a->employee_id,
                'employee_name' => $a->employee?->name,
                'assigned_date' => $a->assigned_date?->format('Y-m-d'),
                'return_date' => $a->return_date?->format('Y-m-d'),
                'expected_return_date' => $a->expected_return_date?->format('Y-m-d'),
                'notes' => $a->notes,
                'is_active' => $a->isActive(),
            ])->values()->all(),
            'maintenances' => $asset->maintenances->map(fn (AssetMaintenance $m) => [
                'id' => $m->id,
                'description' => $m->description,
                'scheduled_date' => $m->scheduled_date?->format('Y-m-d'),
                'completed_date' => $m->completed_date?->format('Y-m-d'),
                'is_pending' => $m->isPending(),
            ])->values()->all(),
        ];
    }

    public function statsForDashboard(): array
    {
        $this->sendDueReminders();

        $total = Asset::count();
        $inMaintenance = Asset::where('status', AssetStatus::Maintenance)->count();
        $assigned = Asset::whereHas('assignments', fn ($q) => $q->whereNull('return_date'))->count();

        return [
            'total_assets' => $total,
            'in_maintenance' => $inMaintenance,
            'assigned_assets' => $assigned,
        ];
    }

    public function sendDueReminders(): void
    {
        $cacheKey = 'asset_reminders_sent_'.Carbon::today()->format('Y-m-d');
        if (Cache::has($cacheKey)) {
            return;
        }

        $today = Carbon::today();

        AssetMaintenance::query()
            ->whereNull('completed_date')
            ->whereBetween('scheduled_date', [$today, $today->copy()->addDays(7)])
            ->with('asset')
            ->each(fn (AssetMaintenance $m) => $this->notifications->notifyMaintenanceDue($m));

        AssetAssignment::query()
            ->whereNull('return_date')
            ->whereNotNull('expected_return_date')
            ->whereDate('expected_return_date', '<=', $today->copy()->addDays(3))
            ->with(['asset', 'employee'])
            ->each(fn (AssetAssignment $a) => $this->notifications->notifyAssetReturnDue($a));

        Cache::put($cacheKey, true, $today->copy()->endOfDay());
    }

    public function qrPayload(Asset $asset): string
    {
        $base = rtrim(config('app.frontend_url', config('app.url')), '/');

        return $base.'/assets?scan='.$asset->qr_token;
    }
}
