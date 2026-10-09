<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TrainingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'start_date' => $this->start_date?->toIso8601String(),
            'end_date' => $this->end_date?->toIso8601String(),
            'trainer_id' => $this->trainer_id,
            'status' => $this->status->value,
            'trainer' => $this->whenLoaded('trainer', fn () => [
                'id' => $this->trainer->id,
                'name' => $this->trainer->name,
                'email' => $this->trainer->email,
            ]),
            'assignees' => $this->whenLoaded('assignees', fn () => $this->assignees->map(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ])),
            'assignee_ids' => $this->whenLoaded('assignees', fn () => $this->assignees->pluck('id')->all()),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
