<?php

namespace App\Models;

use App\Enums\ApplicationStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Candidate extends Model
{
    protected $table = 'applications';

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

    public function jobPosting(): BelongsTo
    {
        return $this->belongsTo(JobPosting::class, 'job_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getNameAttribute(): string
    {
        return $this->candidate_name;
    }

    public function getEmailAttribute(): string
    {
        return $this->candidate_email;
    }

    public function getCvFileAttribute(): string
    {
        return $this->resume_path;
    }
}
