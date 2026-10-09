<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReportResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'type' => $this->type->value,
            'generated_by' => $this->generated_by,
            'generated_at' => $this->generated_at?->toIso8601String(),
            'date_from' => $this->date_from?->format('Y-m-d'),
            'date_to' => $this->date_to?->format('Y-m-d'),
            'department' => $this->department,
            'payload' => $this->when($request->route('report') !== null, $this->payload),
            'is_scheduled' => $this->is_scheduled,
            'schedule_frequency' => $this->schedule_frequency?->value,
            'next_run_at' => $this->next_run_at?->toIso8601String(),
            'generator' => $this->whenLoaded('generator', fn () => [
                'id' => $this->generator->id,
                'name' => $this->generator->name,
                'email' => $this->generator->email,
            ]),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
