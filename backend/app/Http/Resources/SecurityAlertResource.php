<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SecurityAlertResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'severity' => $this->severity->value,
            'status' => $this->status->value,
            'source_type' => $this->source_type,
            'meta' => $this->meta,
            'resolved_at' => $this->resolved_at?->toIso8601String(),
            'resolved_by' => $this->whenLoaded('resolver', fn () => $this->resolver ? [
                'id' => $this->resolver->id,
                'name' => $this->resolver->name,
            ] : null),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
