<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WeeklyChallenge extends Model
{
    protected $fillable = [
        'code',
        'title',
        'description',
        'action_type',
        'target_count',
        'points_reward',
        'department',
        'week_start',
        'week_end',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'week_start' => 'date',
            'week_end' => 'date',
            'is_active' => 'boolean',
        ];
    }

    public function progress(): HasMany
    {
        return $this->hasMany(UserChallengeProgress::class);
    }
}
