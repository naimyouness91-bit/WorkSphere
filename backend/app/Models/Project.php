<?php

namespace App\Models;

use App\Enums\ProjectStatus;
use App\Enums\TaskStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    protected $fillable = [
        'title',
        'description',
        'start_date',
        'end_date',
        'manager_id',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'status' => ProjectStatus::class,
            'start_date' => 'date',
            'end_date' => 'date',
        ];
    }

    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function milestones(): HasMany
    {
        return $this->hasMany(Milestone::class)->orderBy('target_date');
    }

    public function history(): HasMany
    {
        return $this->hasMany(ProjectHistory::class)->latest();
    }

    public function progressPercent(): int
    {
        if (isset($this->tasks_count)) {
            $total = (int) $this->tasks_count;
            $done = (int) ($this->completed_tasks_count ?? 0);

            return $total > 0 ? (int) round(($done / $total) * 100) : 0;
        }

        $total = $this->tasks()->count();

        if ($total === 0) {
            return 0;
        }

        $done = $this->tasks()->where('status', TaskStatus::Done)->count();

        return (int) round(($done / $total) * 100);
    }

    public function isVisibleTo(User $user): bool
    {
        if ($user->hasAnyRole(['admin', 'manager'])) {
            return true;
        }

        return $this->manager_id === $user->id
            || $this->tasks()->where('assigned_to', $user->id)->exists();
    }
}
