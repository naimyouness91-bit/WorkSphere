<?php

namespace App\Services;

use App\Models\Deployment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DevOpsService
{
    public function __construct(
        private NotificationService $notifications,
        private AuditLogger $auditLogger,
    ) {}

    public function listDeployments(?string $environment = null, int $limit = 30): array
    {
        $query = Deployment::query()
            ->with('deployer:id,name')
            ->orderByDesc('created_at')
            ->limit($limit);

        if ($environment) {
            $query->where('environment', $environment);
        }

        return $query->get()->map(fn (Deployment $d) => $this->format($d))->all();
    }

    public function recordDeployment(array $data, ?User $user = null, ?Request $request = null): array
    {
        $environment = $data['environment'];
        $status = $data['status'];
        $version = $data['version'] ?? $data['image_tag'] ?? 'unknown';

        return DB::transaction(function () use ($data, $user, $request, $environment, $status, $version) {
            if ($status === 'success') {
                Deployment::query()
                    ->where('environment', $environment)
                    ->where('is_active', true)
                    ->update(['is_active' => false]);
            }

            $deployment = Deployment::create([
                'environment' => $environment,
                'version' => $version,
                'status' => $status,
                'image_tag' => $data['image_tag'] ?? null,
                'commit_sha' => $data['commit_sha'] ?? null,
                'triggered_by' => $data['triggered_by'] ?? ($user ? 'manual' : 'ci'),
                'deployed_by' => $user?->id,
                'is_active' => $status === 'success',
                'notes' => $data['notes'] ?? null,
                'meta' => $data['meta'] ?? null,
                'started_at' => isset($data['started_at']) ? Carbon::parse($data['started_at']) : Carbon::now(),
                'finished_at' => Carbon::now(),
            ]);

            $this->auditLogger->log(
                $user,
                'deployment_'.$status,
                'devops',
                "Deployment {$version} to {$environment}: {$status}",
                $request,
            );

            if ($status === 'success') {
                $this->notifications->notifyDeploymentResult($deployment, true);
            } elseif ($status === 'failed') {
                $this->notifications->notifyDeploymentResult($deployment, false);
            }

            return $this->format($deployment->fresh('deployer'));
        });
    }

    public function rollback(User $user, Deployment $failedDeployment, ?Request $request = null): array
    {
        $previous = Deployment::query()
            ->where('environment', $failedDeployment->environment)
            ->where('status', 'success')
            ->where('id', '<', $failedDeployment->id)
            ->orderByDesc('id')
            ->first();

        if (! $previous) {
            throw ValidationException::withMessages([
                'deployment' => [__('messages.devops.no_rollback_target')],
            ]);
        }

        return DB::transaction(function () use ($user, $failedDeployment, $previous, $request) {
            Deployment::query()
                ->where('environment', $failedDeployment->environment)
                ->where('is_active', true)
                ->update(['is_active' => false]);

            $failedDeployment->update(['status' => 'rolled_back', 'is_active' => false]);

            Deployment::query()->whereKey($previous->getKey())->update(['is_active' => true]);

            $rollbackRecord = Deployment::create([
                'environment' => $failedDeployment->environment,
                'version' => $previous->version,
                'status' => 'success',
                'image_tag' => $previous->image_tag,
                'commit_sha' => $previous->commit_sha,
                'triggered_by' => 'rollback',
                'deployed_by' => $user->id,
                'rollback_from_id' => $failedDeployment->id,
                'is_active' => true,
                'notes' => __('messages.devops.rollback_note', ['version' => $previous->version]),
                'started_at' => Carbon::now(),
                'finished_at' => Carbon::now(),
            ]);

            $this->auditLogger->log(
                $user,
                'deployment_rollback',
                'devops',
                "Rolled back {$failedDeployment->environment} to {$previous->version}",
                $request,
            );

            $this->notifications->notifyDeploymentRollback($user, $rollbackRecord);

            return [
                'rolled_back' => $this->format($rollbackRecord->fresh('deployer')),
                'restored_version' => $previous->version,
            ];
        });
    }

    public function metricsForAdmin(): array
    {
        $since30 = Carbon::now()->subDays(30);
        $since7 = Carbon::now()->subDays(7);

        $recent = Deployment::query()->where('created_at', '>=', $since30)->get();
        $total = $recent->count();
        $success = $recent->where('status', 'success')->count();
        $failed = $recent->where('status', 'failed')->count();

        $freq7 = Deployment::query()
            ->where('created_at', '>=', $since7)
            ->where('status', 'success')
            ->count();

        $activeStaging = Deployment::query()
            ->where('environment', 'staging')
            ->where('is_active', true)
            ->first();

        $activeProduction = Deployment::query()
            ->where('environment', 'production')
            ->where('is_active', true)
            ->first();

        return [
            'build_success_rate' => $total > 0 ? round(($success / $total) * 100, 1) : 100,
            'deployment_frequency' => $freq7,
            'error_rate' => $total > 0 ? round(($failed / $total) * 100, 1) : 0,
            'total_deployments_30d' => $total,
            'active_staging_version' => $activeStaging?->version,
            'active_production_version' => $activeProduction?->version,
        ];
    }

    private function format(Deployment $d): array
    {
        return [
            'id' => $d->id,
            'environment' => $d->environment,
            'version' => $d->version,
            'status' => $d->status,
            'image_tag' => $d->image_tag,
            'commit_sha' => $d->commit_sha,
            'triggered_by' => $d->triggered_by,
            'is_active' => $d->is_active,
            'notes' => $d->notes,
            'deployed_by_name' => $d->deployer?->name,
            'started_at' => $d->started_at?->toIso8601String(),
            'finished_at' => $d->finished_at?->toIso8601String(),
            'created_at' => $d->created_at?->toIso8601String(),
        ];
    }
}
