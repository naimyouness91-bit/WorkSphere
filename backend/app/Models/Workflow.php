<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Workflow extends Model
{
    protected $fillable = [
        'title',
        'description',
        'steps',
        'assigned_roles',
        'domain',
        'is_active',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'steps' => 'array',
            'assigned_roles' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
