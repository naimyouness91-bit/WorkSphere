<?php

namespace App\Services;

use App\Enums\ActivityAction;
use App\Models\ActivityLog;
use App\Models\User;

class ActivityLogService
{
    public function log(
        User $user,
        ActivityAction $action,
        string $description,
        array $metadata = [],
    ): ActivityLog {
        return ActivityLog::create([
            'user_id' => $user->id,
            'action' => $action,
            'description' => $description,
            'metadata' => $metadata ?: null,
        ]);
    }

    public function recent(int $limit = 25): \Illuminate\Database\Eloquent\Collection
    {
        return ActivityLog::query()
            ->with('user')
            ->latest()
            ->limit($limit)
            ->get();
    }
}
