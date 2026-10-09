<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Deployment extends Model
{
    protected $fillable = [
        'environment',
        'version',
        'status',
        'image_tag',
        'commit_sha',
        'triggered_by',
        'deployed_by',
        'rollback_from_id',
        'is_active',
        'notes',
        'meta',
        'started_at',
        'finished_at',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'meta' => 'array',
            'started_at' => 'datetime',
            'finished_at' => 'datetime',
        ];
    }

    public function deployer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'deployed_by');
    }

    public function rollbackFrom(): BelongsTo
    {
        return $this->belongsTo(Deployment::class, 'rollback_from_id');
    }
}
