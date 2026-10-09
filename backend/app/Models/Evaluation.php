<?php

namespace App\Models;

use App\Enums\EvaluationStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Evaluation extends Model
{
    protected $fillable = [
        'employee_id',
        'evaluator_id',
        'review_period',
        'score',
        'comments',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'status' => EvaluationStatus::class,
            'score' => 'decimal:2',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'employee_id');
    }

    public function evaluator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'evaluator_id');
    }

    public function isVisibleToEmployee(): bool
    {
        return in_array($this->status, [
            EvaluationStatus::Submitted,
            EvaluationStatus::Finalized,
        ], true);
    }

    public function isOwnedBy(User $user): bool
    {
        return $this->employee_id === $user->id;
    }
}
