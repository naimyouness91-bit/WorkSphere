<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'project_id' => $this->project_id,
            'title' => $this->title,
            'description' => $this->description,
            'assigned_to' => $this->assigned_to,
            'due_date' => $this->due_date?->format('Y-m-d'),
            'status' => $this->status->value,
            'is_overdue' => $this->isOverdue(),
            'project' => $this->whenLoaded('project', fn () => [
                'id' => $this->project->id,
                'title' => $this->project->title,
                'start_date' => $this->project->start_date?->format('Y-m-d'),
                'end_date' => $this->project->end_date?->format('Y-m-d'),
            ]),
            'assignee' => $this->whenLoaded('assignee', fn () => $this->assignee ? [
                'id' => $this->assignee->id,
                'name' => $this->assignee->name,
                'email' => $this->assignee->email,
            ] : null),
            'dependency_ids' => $this->whenLoaded('dependencies', fn () => $this->dependencies->pluck('id')),
            'dependencies' => $this->whenLoaded('dependencies', fn () => $this->dependencies->map(fn ($d) => [
                'id' => $d->id,
                'title' => $d->title,
                'status' => $d->status->value,
            ])),
            'can_start' => $this->when(
                $this->relationLoaded('dependencies'),
                fn () => $this->canStart(),
            ),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
