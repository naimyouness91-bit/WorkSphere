<?php

namespace App\Services;

use App\Enums\ConversationType;
use App\Enums\MessageStatus;
use App\Enums\NotificationType;
use App\Events\ChatMessageRead;
use App\Events\ChatMessageSent;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ChatService
{
    public function __construct(private NotificationService $notifications) {}

    public function findOrCreateDirect(User $current, int $otherUserId): Conversation
    {
        $existing = Conversation::findDirectBetween($current->id, $otherUserId);

        if ($existing) {
            return $existing->load(['participants', 'latestMessage.sender']);
        }

        return DB::transaction(function () use ($current, $otherUserId) {
            $conversation = Conversation::create([
                'type' => ConversationType::Direct,
                'created_by' => $current->id,
            ]);

            $conversation->participants()->attach([$current->id, $otherUserId]);

            return $conversation->load(['participants', 'latestMessage.sender']);
        });
    }

    public function createGroup(User $creator, string $name, array $participantIds): Conversation
    {
        $ids = collect($participantIds)
            ->push($creator->id)
            ->unique()
            ->values()
            ->all();

        return DB::transaction(function () use ($creator, $name, $ids) {
            $conversation = Conversation::create([
                'type' => ConversationType::Group,
                'name' => $name,
                'created_by' => $creator->id,
            ]);

            $conversation->participants()->attach($ids);

            return $conversation->load(['participants', 'latestMessage.sender']);
        });
    }

    public function markConversationRead(Conversation $conversation, User $user): void
    {
        $conversation->participants()->updateExistingPivot($user->id, [
            'last_read_at' => now(),
        ]);

        $unread = Message::query()
            ->where('conversation_id', $conversation->id)
            ->where('sender_id', '!=', $user->id)
            ->where('status', '!=', MessageStatus::Read)
            ->get();

        foreach ($unread as $message) {
            $this->markMessageRead($message, $user, broadcast: false);
        }
    }

    public function markMessageRead(Message $message, User $user, bool $broadcast = true): void
    {
        if ($message->sender_id === $user->id) {
            return;
        }

        if (! $message->conversation->hasParticipant($user)) {
            return;
        }

        $message->readBy()->syncWithoutDetaching([
            $user->id => ['read_at' => now()],
        ]);

        if ($message->receiver_id === $user->id || $message->conversation->type === ConversationType::Direct) {
            $message->update(['status' => MessageStatus::Read]);
        }

        if ($broadcast) {
            broadcast(new ChatMessageRead(
                $message->conversation_id,
                $message->id,
                $user->id,
            ));
        }
    }

    public function notifyParticipants(Message $message, User $sender): void
    {
        $message->load('conversation.participants');

        /** @var Collection<int, User> $recipients */
        $recipients = $message->conversation->participants->where('id', '!=', $sender->id);

        $preview = $message->hasAttachment()
            ? __('messages.chat.attachment_preview')
            : \Illuminate\Support\Str::limit($message->content ?? '', 80);

        foreach ($recipients as $recipient) {
            $this->notifications->notifyUser(
                $recipient->id,
                __('messages.chat.new_message', ['name' => $sender->name, 'preview' => $preview]),
                NotificationType::Info,
            );
        }
    }

    public function dispatchMessageSent(Message $message): void
    {
        broadcast(new ChatMessageSent($message));
        $message->load('sender');
        $this->notifyParticipants($message, $message->sender);
    }
}
