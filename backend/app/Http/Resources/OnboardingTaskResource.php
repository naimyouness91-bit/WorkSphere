<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OnboardingTaskResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'employee_id' => $this->employee_id,
            'task_title' => $this->task_title,
            'description' => $this->description,
            'due_date' => $this->due_date?->format('Y-m-d'),
            'status' => $this->status->value,
            'completed_at' => $this->completed_at?->toIso8601String(),
            'employee' => $this->whenLoaded('employee', fn () => [
                'id' => $this->employee->id,
                'name' => $this->employee->name,
                'email' => $this->employee->email,
            ]),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
