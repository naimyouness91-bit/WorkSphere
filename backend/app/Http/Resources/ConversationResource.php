<?php

namespace App\Http\Resources;

use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConversationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $request->user('api');
        $pivot = $user ? $this->participants->firstWhere('id', $user->id)?->pivot : null;
        $lastRead = $pivot?->last_read_at;

        $unreadCount = 0;
        if ($user && $lastRead) {
            $unreadCount = Message::query()
                ->where('conversation_id', $this->id)
                ->where('sender_id', '!=', $user->id)
                ->where('created_at', '>', $lastRead)
                ->count();
        } elseif ($user) {
            $unreadCount = Message::query()
                ->where('conversation_id', $this->id)
                ->where('sender_id', '!=', $user->id)
                ->count();
        }

        return [
            'id' => $this->id,
            'type' => $this->type->value,
            'name' => $this->displayName($user?->id),
            'created_by' => $this->created_by,
            'participants' => $this->whenLoaded('participants', fn () => $this->participants->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'email' => $p->email,
            ])),
            'last_message' => $this->whenLoaded('latestMessage', fn () => $this->latestMessage
                ? new MessageResource($this->latestMessage)
                : null),
            'unread_count' => $unreadCount,
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }

    private function displayName(?int $currentUserId): ?string
    {
        if ($this->type->value === 'group') {
            return $this->name;
        }

        if (! $currentUserId || ! $this->relationLoaded('participants')) {
            return $this->name;
        }

        $other = $this->participants->firstWhere('id', '!=', $currentUserId);

        return $other?->name ?? $this->name;
    }
}
