<?php

namespace App\Http\Controllers\Api;

use App\Enums\IntegrationService;
use App\Enums\IntegrationStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Integration\ConnectIntegrationRequest;
use App\Http\Requests\Integration\SendIntegrationEmailRequest;
use App\Http\Requests\Integration\SendIntegrationMessageRequest;
use App\Http\Requests\Integration\StoreIntegrationRequest;
use App\Http\Requests\Integration\UpdateIntegrationRequest;
use App\Http\Resources\IntegrationLogResource;
use App\Http\Resources\IntegrationResource;
use App\Http\Resources\WebhookLogResource;
use App\Models\Integration;
use App\Models\User;
use App\Services\Integrations\IntegrationFailureHandler;
use App\Services\Integrations\IntegrationManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class IntegrationController extends Controller
{
    public function __construct(
        private IntegrationManager $integrationManager,
        private IntegrationFailureHandler $failureHandler,
    ) {}

    public function index(Request $request): AnonymousResourceCollection|JsonResponse
    {
        if (! $this->canManage($request->user('api'))) {
            return response()->json(['message' => __('messages.integrations.forbidden')], 403);
        }

        $integrations = Integration::query()->orderBy('service_name')->get();

        return IntegrationResource::collection($integrations);
    }

    public function connect(ConnectIntegrationRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        if (! $this->canManage($user)) {
            return response()->json(['message' => __('messages.integrations.forbidden')], 403);
        }

        $validated = $request->validated();
        if (isset($validated['status'])) {
            $validated['status'] = IntegrationStatus::from($validated['status']);
        }

        $integration = $this->integrationManager->connect($user, $validated);

        return response()->json([
            'message' => __('messages.integrations.created'),
            'data' => new IntegrationResource($integration),
        ], 201);
    }

    public function store(StoreIntegrationRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        if (! $this->canManage($user)) {
            return response()->json(['message' => __('messages.integrations.forbidden')], 403);
        }

        $validated = $request->validated();

        $integration = $this->integrationManager->connect($user, $validated);

        return response()->json([
            'message' => __('messages.integrations.created'),
            'data' => new IntegrationResource($integration),
        ], 201);
    }

    public function update(UpdateIntegrationRequest $request, Integration $integration): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        if (! $this->canManage($user)) {
            return response()->json(['message' => __('messages.integrations.forbidden')], 403);
        }

        $wasActive = $integration->isActive();
        $validated = $request->validated();

        if (array_key_exists('api_key', $validated) && blank($validated['api_key'])) {
            unset($validated['api_key']);
        }

        $integration->update($validated);

        if ($wasActive && $integration->fresh()->status === IntegrationStatus::Inactive) {
            $this->failureHandler->handleDisconnect($integration);
        }

        return response()->json([
            'message' => __('messages.integrations.updated'),
            'data' => new IntegrationResource($integration->fresh()),
        ]);
    }

    public function destroy(Integration $integration): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        if (! $this->canManage($user)) {
            return response()->json(['message' => __('messages.integrations.forbidden')], 403);
        }

        if ($integration->isActive()) {
            $this->failureHandler->handleDisconnect($integration);
        }

        $integration->delete();

        return response()->json(['message' => __('messages.integrations.deleted')]);
    }

    public function sendMessage(SendIntegrationMessageRequest $request): JsonResponse
    {
        if (! $this->canManage($request->user('api'))) {
            return response()->json(['message' => __('messages.integrations.forbidden')], 403);
        }

        $validated = $request->validated();

        try {
            $this->integrationManager->sendMessage(
                IntegrationService::from($validated['service']),
                $validated['message'],
                $validated['title'] ?? null,
            );

            return response()->json(['message' => __('messages.integrations.message_sent')]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => __('messages.integrations.message_failed'),
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    public function sendEmail(SendIntegrationEmailRequest $request): JsonResponse
    {
        if (! $this->canManage($request->user('api'))) {
            return response()->json(['message' => __('messages.integrations.forbidden')], 403);
        }

        $validated = $request->validated();

        try {
            $this->integrationManager->sendEmailMessage(
                $validated['to'],
                $validated['subject'],
                $validated['body'],
            );

            return response()->json(['message' => __('messages.integrations.email_sent')]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => __('messages.integrations.email_failed'),
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    public function test(Request $request, Integration $integration): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        if (! $this->canManage($user)) {
            return response()->json(['message' => __('messages.integrations.forbidden')], 403);
        }

        $testEmail = $request->string('test_email')->toString() ?: null;

        try {
            $this->integrationManager->test($integration, $testEmail);

            return response()->json([
                'message' => __('messages.integrations.test_success'),
                'data' => new IntegrationResource($integration->fresh()),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => __('messages.integrations.test_failed'),
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    public function logs(Request $request): AnonymousResourceCollection|JsonResponse
    {
        if (! $this->canManage($request->user('api'))) {
            return response()->json(['message' => __('messages.integrations.forbidden')], 403);
        }

        $query = \App\Models\IntegrationLog::query()
            ->with('integration')
            ->latest();

        if ($request->filled('integration_id')) {
            $query->where('integration_id', $request->integer('integration_id'));
        }

        return IntegrationLogResource::collection($query->limit(100)->get());
    }

    public function webhookLogs(Request $request): AnonymousResourceCollection|JsonResponse
    {
        if (! $this->canManage($request->user('api'))) {
            return response()->json(['message' => __('messages.integrations.forbidden')], 403);
        }

        return WebhookLogResource::collection(
            $this->integrationManager->webhookLogs($request)->paginate(50),
        );
    }

    public function exportLogs(Request $request): JsonResponse
    {
        if (! $this->canManage($request->user('api'))) {
            return response()->json(['message' => __('messages.integrations.forbidden')], 403);
        }

        $type = $request->string('type')->toString() ?: 'activity';

        return response()->json([
            'data' => $type === 'webhook'
                ? $this->integrationManager->exportWebhookLogs($request)
                : $this->integrationManager->exportActivityLogs($request),
            'exported_at' => now()->toIso8601String(),
        ]);
    }

    public function summary(Request $request): JsonResponse
    {
        if (! $this->canManage($request->user('api'))) {
            return response()->json(['message' => __('messages.integrations.forbidden')], 403);
        }

        $kpis = $this->integrationManager->dashboardKpis();
        if ($kpis['last_sync_at']) {
            $kpis['last_sync_at'] = \Carbon\Carbon::parse($kpis['last_sync_at'])->toIso8601String();
        }

        return response()->json([
            'data' => ['kpis' => $kpis],
        ]);
    }

    public function export(Request $request): JsonResponse
    {
        if (! $this->canManage($request->user('api'))) {
            return response()->json(['message' => __('messages.integrations.forbidden')], 403);
        }

        return response()->json([
            'data' => $this->integrationManager->exportSettings(),
            'exported_at' => now()->toIso8601String(),
        ]);
    }

    public function syncCalendars(Request $request): JsonResponse
    {
        if (! $this->canManage($request->user('api'))) {
            return response()->json(['message' => __('messages.integrations.forbidden')], 403);
        }

        $count = $this->integrationManager->syncCalendars();

        return response()->json([
            'message' => __('messages.integrations.calendar_synced', ['count' => $count]),
            'data' => ['synced' => $count],
        ]);
    }

    private function canManage(?User $user): bool
    {
        return $user !== null && $user->role === UserRole::Admin;
    }
}
