<?php

namespace App\Models;

use App\Enums\GoalStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PerformanceGoal extends Model
{
    protected $fillable = [
        'employee_id',
        'title',
        'description',
        'target_date',
        'status',
        'progress',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'status' => GoalStatus::class,
            'target_date' => 'date',
            'progress' => 'integer',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'employee_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
