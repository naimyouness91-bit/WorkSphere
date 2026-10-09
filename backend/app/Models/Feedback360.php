<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Feedback360 extends Model
{
    protected $table = 'feedback_360';

    protected $fillable = [
        'employee_id',
        'from_user_id',
        'feedback_text',
        'rating',
        'feedback_date',
        'is_anonymous',
    ];

    protected function casts(): array
    {
        return [
            'rating' => 'decimal:2',
            'feedback_date' => 'date',
            'is_anonymous' => 'boolean',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'employee_id');
    }

    public function fromUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'from_user_id');
    }
}
