<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PayrollResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'employee_id' => $this->employee_id,
            'base_salary' => (float) $this->base_salary,
            'bonuses' => (float) $this->bonuses,
            'deductions' => (float) $this->deductions,
            'net_salary' => (float) $this->net_salary,
            'pay_date' => $this->pay_date?->format('Y-m-d'),
            'employee' => $this->whenLoaded('employee', fn () => [
                'id' => $this->employee->id,
                'name' => $this->employee->name,
                'email' => $this->employee->email,
                'department' => $this->employee->department,
                'position' => $this->employee->position,
            ]),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
