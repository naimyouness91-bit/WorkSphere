<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InsightResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'category' => $this->category->value,
            'confidence_score' => (float) $this->confidence_score,
            'meta' => $this->meta,
            'recommendation' => $this->recommendation,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
