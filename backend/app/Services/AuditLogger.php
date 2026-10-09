<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class AuditLogger
{
    public function log(
        ?User $user,
        string $action,
        string $module,
        string $description,
        ?Request $request = null,
    ): AuditLog {
        return DB::transaction(function () use ($user, $action, $module, $description, $request) {
            $previousHash = AuditLog::query()->orderByDesc('id')->value('integrity_hash') ?? 'genesis';
            $loggedAt = Carbon::now();

            $payload = json_encode([
                'user_id' => $user?->id,
                'action' => $action,
                'module' => $module,
                'description' => $description,
                'ip_address' => $request?->ip(),
                'logged_at' => $loggedAt->toIso8601String(),
                'previous_hash' => $previousHash,
            ], JSON_THROW_ON_ERROR);

            $integrityHash = hash('sha256', $payload.config('app.key'));

            return AuditLog::create([
                'user_id' => $user?->id,
                'action' => $action,
                'module' => $module,
                'description' => $description,
                'ip_address' => $request?->ip(),
                'logged_at' => $loggedAt,
                'previous_hash' => $previousHash,
                'integrity_hash' => $integrityHash,
            ]);
        });
    }

    public function verifyChain(int $limit = 500): array
    {
        $logs = AuditLog::query()
            ->orderBy('id')
            ->limit($limit)
            ->get(['id', 'user_id', 'action', 'module', 'description', 'ip_address', 'logged_at', 'integrity_hash', 'previous_hash']);

        $valid = true;
        $brokenAt = null;
        $expectedPrevious = 'genesis';

        foreach ($logs as $log) {
            if ($log->previous_hash !== $expectedPrevious) {
                $valid = false;
                $brokenAt = $log->id;
                break;
            }

            $payload = json_encode([
                'user_id' => $log->user_id,
                'action' => $log->action,
                'module' => $log->module,
                'description' => $log->description,
                'ip_address' => $log->ip_address,
                'logged_at' => $log->logged_at?->toIso8601String(),
                'previous_hash' => $log->previous_hash,
            ], JSON_THROW_ON_ERROR);

            $expectedHash = hash('sha256', $payload.config('app.key'));

            if ($log->integrity_hash !== $expectedHash) {
                $valid = false;
                $brokenAt = $log->id;
                break;
            }

            $expectedPrevious = $log->integrity_hash;
        }

        return [
            'valid' => $valid,
            'checked' => $logs->count(),
            'broken_at_id' => $brokenAt,
        ];
    }
}
