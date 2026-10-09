<?php

namespace App\Http\Controllers\Api;

use App\Enums\ConversationType;
use App\Events\ChatUserTyping;
use App\Http\Controllers\Controller;
use App\Http\Requests\Chat\StoreConversationRequest;
use App\Http\Resources\ConversationResource;
use App\Models\Conversation;
use App\Models\User;
use App\Services\ChatService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ConversationController extends Controller
{
    public function __construct(private ChatService $chat) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        /** @var User $user */
        $user = $request->user('api');

        $conversations = Conversation::query()
            ->whereHas('participants', fn ($q) => $q->where('users.id', $user->id))
            ->with(['participants', 'latestMessage.sender'])
            ->withMax('messages', 'created_at')
            ->orderByDesc('messages_max_created_at')
            ->get();

        return ConversationResource::collection($conversations);
    }

    public function store(StoreConversationRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');
        $validated = $request->validated();

        if ($validated['type'] === ConversationType::Direct->value) {
            $otherId = (int) collect($validated['participant_ids'])->first(fn ($id) => (int) $id !== $user->id);

            if (! $otherId) {
                return response()->json(['message' => __('messages.chat.direct_requires_peer')], 422);
            }

            $conversation = $this->chat->findOrCreateDirect($user, $otherId);
        } else {
            $conversation = $this->chat->createGroup(
                $user,
                $validated['name'] ?? __('messages.chat.default_group_name'),
                $validated['participant_ids'],
            );
        }

        return response()->json([
            'message' => __('messages.chat.conversation_created'),
            'data' => new ConversationResource($conversation),
        ], 201);
    }

    public function show(Conversation $conversation): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        if (! $conversation->hasParticipant($user)) {
            return response()->json(['message' => __('messages.chat.forbidden')], 403);
        }

        $conversation->load(['participants', 'latestMessage.sender']);
        $this->chat->markConversationRead($conversation, $user);

        return response()->json([
            'data' => new ConversationResource($conversation),
        ]);
    }

    public function typing(Request $request, Conversation $conversation): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        if (! $conversation->hasParticipant($user)) {
            return response()->json(['message' => __('messages.chat.forbidden')], 403);
        }

        $isTyping = $request->boolean('is_typing', true);

        broadcast(new ChatUserTyping(
            $conversation->id,
            $user->id,
            $user->name,
            $isTyping,
        ));

        return response()->json(['ok' => true]);
    }
}
