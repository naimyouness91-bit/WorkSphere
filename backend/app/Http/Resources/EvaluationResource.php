<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EvaluationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'employee_id' => $this->employee_id,
            'evaluator_id' => $this->evaluator_id,
            'review_period' => $this->review_period,
            'score' => (float) $this->score,
            'comments' => $this->comments,
            'status' => $this->status->value,
            'employee' => $this->whenLoaded('employee', fn () => [
                'id' => $this->employee->id,
                'name' => $this->employee->name,
                'email' => $this->employee->email,
            ]),
            'evaluator' => $this->whenLoaded('evaluator', fn () => [
                'id' => $this->evaluator->id,
                'name' => $this->evaluator->name,
                'email' => $this->evaluator->email,
            ]),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
