<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class Feedback360Resource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $anonymous = (bool) ($this->resource->getAttribute('mask_anonymous') ?? false);

        return [
            'id' => $this->id,
            'employee_id' => $this->employee_id,
            'from_user' => $anonymous
                ? null
                : $this->whenLoaded('fromUser', fn () => [
                    'id' => $this->fromUser->id,
                    'name' => $this->fromUser->name,
                ]),
            'is_anonymous' => $this->is_anonymous,
            'is_anonymous_display' => $anonymous,
            'feedback_text' => $this->feedback_text,
            'rating' => (float) $this->rating,
            'feedback_date' => $this->feedback_date?->format('Y-m-d'),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
