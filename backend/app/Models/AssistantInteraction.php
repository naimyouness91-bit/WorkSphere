<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssistantInteraction extends Model
{
    protected $fillable = [
        'user_id',
        'interaction_type',
        'user_message',
        'assistant_response',
        'suggestions',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'suggestions' => 'array',
            'meta' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
