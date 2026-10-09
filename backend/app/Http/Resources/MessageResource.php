<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class MessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'conversation_id' => $this->conversation_id,
            'sender_id' => $this->sender_id,
            'receiver_id' => $this->receiver_id,
            'content' => $this->content,
            'status' => $this->status->value,
            'attachment' => $this->hasAttachment() ? [
                'url' => Storage::disk('public')->url($this->attachment_path),
                'name' => $this->attachment_original_name,
                'mime' => $this->attachment_mime,
                'size' => $this->attachment_size,
            ] : null,
            'sender' => $this->whenLoaded('sender', fn () => [
                'id' => $this->sender->id,
                'name' => $this->sender->name,
                'email' => $this->sender->email,
            ]),
            'read_by_user_ids' => $this->whenLoaded('readBy', fn () => $this->readBy->pluck('id')->all()),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
