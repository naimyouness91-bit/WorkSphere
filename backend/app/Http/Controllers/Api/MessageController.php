<?php

namespace App\Http\Controllers\Api;

use App\Enums\ConversationType;
use App\Enums\MessageStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Chat\StoreMessageRequest;
use App\Http\Resources\MessageResource;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use App\Services\ChatService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;

class MessageController extends Controller
{
    public function __construct(private ChatService $chat) {}

    public function index(Request $request, Conversation $conversation): AnonymousResourceCollection|JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        if (! $conversation->hasParticipant($user)) {
            return response()->json(['message' => __('messages.chat.forbidden')], 403);
        }

        $messages = Message::query()
            ->where('conversation_id', $conversation->id)
            ->with(['sender', 'readBy'])
            ->orderBy('created_at')
            ->limit(100)
            ->get();

        $this->chat->markConversationRead($conversation, $user);

        return MessageResource::collection($messages);
    }

    public function store(StoreMessageRequest $request, Conversation $conversation): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        if (! $conversation->hasParticipant($user)) {
            return response()->json(['message' => __('messages.chat.forbidden')], 403);
        }

        $receiverId = null;
        if ($conversation->type === ConversationType::Direct) {
            $receiverId = $conversation->participants
                ->where('id', '!=', $user->id)
                ->first()
                ?->id;
        }

        $data = [
            'conversation_id' => $conversation->id,
            'sender_id' => $user->id,
            'receiver_id' => $receiverId,
            'content' => $request->validated('content'),
            'status' => MessageStatus::Sent,
        ];

        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $path = $file->store('chat/'.$conversation->id, 'public');
            $data['attachment_path'] = $path;
            $data['attachment_original_name'] = $file->getClientOriginalName();
            $data['attachment_mime'] = $file->getMimeType();
            $data['attachment_size'] = $file->getSize();
        }

        $message = Message::create($data);
        $message->load(['sender', 'readBy']);

        $conversation->touch();

        $this->chat->dispatchMessageSent($message);

        return response()->json([
            'message' => __('messages.chat.message_sent'),
            'data' => new MessageResource($message),
        ], 201);
    }

    public function show(Message $message): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        if (! $message->conversation->hasParticipant($user)) {
            return response()->json(['message' => __('messages.chat.forbidden')], 403);
        }

        $message->load(['sender', 'readBy', 'conversation.participants']);

        return response()->json([
            'data' => new MessageResource($message),
        ]);
    }

    public function update(Message $message): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        if (! $message->conversation->hasParticipant($user)) {
            return response()->json(['message' => __('messages.chat.forbidden')], 403);
        }

        $this->chat->markMessageRead($message, $user);

        $message->load(['sender', 'readBy']);

        return response()->json([
            'message' => __('messages.chat.message_read'),
            'data' => new MessageResource($message),
        ]);
    }

    public function download(Message $message): JsonResponse|\Symfony\Component\HttpFoundation\StreamedResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        if (! $message->conversation->hasParticipant($user) || ! $message->hasAttachment()) {
            return response()->json(['message' => __('messages.chat.forbidden')], 403);
        }

        if (! Storage::disk('public')->exists($message->attachment_path)) {
            return response()->json(['message' => __('messages.chat.file_missing')], 404);
        }

        return Storage::disk('public')->download(
            $message->attachment_path,
            $message->attachment_original_name ?? 'attachment',
        );
    }
}
