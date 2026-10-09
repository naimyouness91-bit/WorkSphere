<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AssistantInteractionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'interaction_type' => $this->interaction_type,
            'user_message' => $this->user_message,
            'assistant_response' => $this->assistant_response,
            'suggestions' => $this->suggestions,
            'created_at' => $this->created_at,
        ];
    }
}
