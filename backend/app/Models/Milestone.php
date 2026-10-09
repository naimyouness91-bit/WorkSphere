<?php

namespace App\Models;

use App\Enums\MilestoneStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Milestone extends Model
{
    protected $fillable = [
        'project_id',
        'title',
        'target_date',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'target_date' => 'date',
            'status' => MilestoneStatus::class,
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function isUpcoming(int $withinDays = 7): bool
    {
        if ($this->status !== MilestoneStatus::Pending) {
            return false;
        }

        return $this->target_date->between(now()->startOfDay(), now()->addDays($withinDays)->endOfDay());
    }
}
