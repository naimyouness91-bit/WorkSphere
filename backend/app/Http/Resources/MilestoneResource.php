<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MilestoneResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'project_id' => $this->project_id,
            'title' => $this->title,
            'target_date' => $this->target_date?->format('Y-m-d'),
            'status' => $this->status->value,
            'is_upcoming' => $this->isUpcoming(),
        ];
    }
}
