<?php

namespace App\Models;

use App\Enums\JobStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Job extends Model
{
    protected $table = 'job_postings';

    protected $fillable = [
        'title',
        'description',
        'requirements',
        'department',
        'location',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'status' => JobStatus::class,
        ];
    }

    public function applications(): HasMany
    {
        return $this->hasMany(Application::class);
    }
}
