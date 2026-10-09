<?php

namespace App\Models;

use App\Enums\ApplicationStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Application extends Model
{
    protected $attributes = [
        'status' => 'applied',
    ];

    protected $fillable = [
        'job_id',
        'user_id',
        'candidate_name',
        'candidate_email',
        'resume_path',
        'original_resume_filename',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'status' => ApplicationStatus::class,
        ];
    }

    public function job(): BelongsTo
    {
        return $this->belongsTo(Job::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isOwnedBy(User $user): bool
    {
        if ($this->user_id !== null) {
            return $this->user_id === $user->id;
        }

        return strcasecmp($this->candidate_email, $user->email) === 0;
    }
}
