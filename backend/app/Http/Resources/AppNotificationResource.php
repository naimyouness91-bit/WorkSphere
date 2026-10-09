<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AppNotificationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'message' => $this->message,
            'type' => $this->type->value,
            'category' => $this->category instanceof \App\Enums\NotificationCategory
                ? $this->category->value
                : ($this->category ?? 'system'),
            'user_id' => $this->user_id,
            'read_status' => $this->read_status,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
