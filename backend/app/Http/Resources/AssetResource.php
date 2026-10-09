<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AssetResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'type' => $this->type->value,
            'serial_number' => $this->serial_number,
            'purchase_date' => $this->purchase_date?->format('Y-m-d'),
            'status' => $this->status->value,
            'qr_token' => $this->qr_token,
            'notes' => $this->notes,
            'is_assigned' => $this->relationLoaded('activeAssignment')
                ? $this->activeAssignment !== null
                : $this->isAssigned(),
            'active_assignment' => $this->whenLoaded('activeAssignment', function () {
                $a = $this->activeAssignment;
                if (! $a) {
                    return null;
                }

                return [
                    'id' => $a->id,
                    'employee_id' => $a->employee_id,
                    'employee' => $a->relationLoaded('employee') ? [
                        'id' => $a->employee->id,
                        'name' => $a->employee->name,
                    ] : null,
                    'assigned_date' => $a->assigned_date?->format('Y-m-d'),
                    'expected_return_date' => $a->expected_return_date?->format('Y-m-d'),
                ];
            }),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
