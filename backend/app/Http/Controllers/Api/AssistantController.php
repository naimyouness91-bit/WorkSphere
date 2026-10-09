<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AssistantInteractionResource;
use App\Services\AssistantService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AssistantController extends Controller
{
    public function __construct(
        private AssistantService $assistant,
    ) {}

    public function suggest(Request $request): JsonResponse
    {
        $user = $request->user('api');
        $data = $this->assistant->suggest($user);

        return response()->json(['data' => $data]);
    }

    public function chat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => ['required', 'string', 'max:4000'],
        ]);

        $user = $request->user('api');
        $data = $this->assistant->chat($user, $validated['message']);

        return response()->json(['data' => $data]);
    }

    public function history(Request $request): JsonResponse
    {
        $user = $request->user('api');
        $limit = min((int) $request->query('limit', 20), 50);

        $items = $this->assistant->history($user, $limit);

        return response()->json([
            'data' => AssistantInteractionResource::collection($items),
            'ai_suggestions_today' => $this->assistant->suggestionsTodayCount($user),
        ]);
    }

    public function stats(Request $request): JsonResponse
    {
        $user = $request->user('api');

        return response()->json([
            'data' => [
                'ai_suggestions_today' => $this->assistant->suggestionsTodayCount($user),
                'ai_configured' => app(\App\Services\Ai\AiClientService::class)->isConfigured(),
            ],
        ]);
    }
}
