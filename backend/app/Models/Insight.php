<?php

namespace App\Models;

use App\Enums\InsightCategory;
use Illuminate\Database\Eloquent\Model;

class Insight extends Model
{
    protected $fillable = [
        'title',
        'description',
        'category',
        'confidence_score',
        'meta',
        'recommendation',
        'is_active',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'category' => InsightCategory::class,
            'confidence_score' => 'float',
            'meta' => 'array',
            'recommendation' => 'array',
            'is_active' => 'boolean',
            'expires_at' => 'datetime',
        ];
    }
}
