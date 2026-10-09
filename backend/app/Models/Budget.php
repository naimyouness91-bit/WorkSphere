<?php

namespace App\Models;

use App\Enums\BudgetPeriod;
use App\Enums\BudgetStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Budget extends Model
{
    protected $fillable = [
        'department',
        'allocated_amount',
        'spent_amount',
        'status',
        'exceeded_notified_at',
        'period',
        'period_year',
        'period_month',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'allocated_amount' => 'decimal:2',
            'spent_amount' => 'decimal:2',
            'status' => BudgetStatus::class,
            'exceeded_notified_at' => 'datetime',
            'period' => BudgetPeriod::class,
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function remainingAmount(): float
    {
        return max(0, (float) $this->allocated_amount - (float) $this->spent_amount);
    }

    public function usagePercent(): float
    {
        $allocated = (float) $this->allocated_amount;

        if ($allocated <= 0) {
            return 0;
        }

        return min(100, round(((float) $this->spent_amount / $allocated) * 100, 1));
    }
}
