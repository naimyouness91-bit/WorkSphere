<?php

namespace App\Models;

use App\Enums\TrainingStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Training extends Model
{
    protected $fillable = [
        'title',
        'description',
        'start_date',
        'end_date',
        'trainer_id',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'status' => TrainingStatus::class,
            'start_date' => 'datetime',
            'end_date' => 'datetime',
        ];
    }

    public function trainer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'trainer_id');
    }

    public function assignees(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'training_user')->withTimestamps();
    }

    public function isAssignedTo(User $user): bool
    {
        return $this->trainer_id === $user->id
            || $this->assignees()->where('users.id', $user->id)->exists();
    }
}
