<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BudgetResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'department' => $this->department,
            'allocated_amount' => (float) $this->allocated_amount,
            'spent_amount' => (float) $this->spent_amount,
            'remaining_amount' => $this->remainingAmount(),
            'usage_percent' => $this->usagePercent(),
            'status' => $this->status?->value ?? 'active',
            'period' => $this->period->value,
            'period_year' => $this->period_year,
            'period_month' => $this->period_month,
            'created_by' => $this->created_by,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
