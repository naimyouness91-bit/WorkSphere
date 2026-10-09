<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContractResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'employee_id' => $this->employee_id,
            'employee' => $this->whenLoaded('employee', fn () => [
                'id' => $this->employee->id,
                'name' => $this->employee->name,
                'email' => $this->employee->email,
            ]),
            'original_filename' => $this->original_filename,
            'mime_type' => $this->mime_type,
            'status' => $this->status->value,
            'expires_at' => $this->expires_at?->format('Y-m-d'),
            'signed_at' => $this->signed_at?->toIso8601String(),
            'has_signed_pdf' => $this->signed_contract_path !== null,
            'signature' => $this->whenLoaded('signature', fn () => [
                'signed_at' => $this->signature->signed_at?->toIso8601String(),
                'ip_address' => $this->signature->ip_address,
            ]),
            'published_by' => $this->published_by,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
