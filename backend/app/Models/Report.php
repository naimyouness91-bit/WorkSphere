<?php

namespace App\Models;

use App\Enums\ReportScheduleFrequency;
use App\Enums\ReportType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Report extends Model
{
    protected $fillable = [
        'title',
        'description',
        'type',
        'generated_by',
        'generated_at',
        'date_from',
        'date_to',
        'department',
        'payload',
        'is_scheduled',
        'schedule_frequency',
        'next_run_at',
    ];

    protected function casts(): array
    {
        return [
            'type' => ReportType::class,
            'generated_at' => 'datetime',
            'date_from' => 'date',
            'date_to' => 'date',
            'payload' => 'array',
            'is_scheduled' => 'boolean',
            'schedule_frequency' => ReportScheduleFrequency::class,
            'next_run_at' => 'datetime',
        ];
    }

    public function generator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'generated_by');
    }
}
