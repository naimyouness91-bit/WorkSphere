<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Crm\LogInteractionRequest;
use App\Http\Requests\Crm\StoreClientRequest;
use App\Http\Requests\Crm\StoreDealRequest;
use App\Http\Requests\Crm\StorePartnerRequest;
use App\Http\Requests\Crm\SyncIntegrationsRequest;
use App\Http\Requests\Crm\UpdateDealStatusRequest;
use App\Http\Resources\ClientResource;
use App\Http\Resources\CrmInteractionResource;
use App\Http\Resources\DealResource;
use App\Http\Resources\PartnerResource;
use App\Models\Client;
use App\Models\CrmAuditLog;
use App\Models\Deal;
use App\Models\Partner;
use App\Models\User;
use App\Services\CrmService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CrmController extends Controller
{
    public function __construct(
        private CrmService $crm,
    ) {}

    public function overview(): JsonResponse
    {
        return response()->json(['data' => $this->crm->overview()]);
    }

    public function getClients(Request $request): AnonymousResourceCollection
    {
        $query = Client::query()
            ->with('owner:id,name')
            ->withCount('deals')
            ->orderBy('company');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('company')) {
            $query->where('company', $request->string('company'));
        }

        return ClientResource::collection($query->get());
    }

    public function addClient(StoreClientRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        if (! $this->crm->canManage($user)) {
            return response()->json(['message' => __('messages.crm.forbidden')], 403);
        }

        $client = $this->crm->addClient($user, $request->validated());

        return response()->json([
            'message' => __('messages.crm.client_created'),
            'data' => new ClientResource($client),
        ], 201);
    }

    public function getPartners(Request $request): AnonymousResourceCollection
    {
        $query = Partner::query()
            ->with('owner:id,name')
            ->orderBy('organization');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return PartnerResource::collection($query->get());
    }

    public function addPartner(StorePartnerRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        if (! $this->crm->canManage($user)) {
            return response()->json(['message' => __('messages.crm.forbidden')], 403);
        }

        $partner = $this->crm->addPartner($user, $request->validated());

        return response()->json([
            'message' => __('messages.crm.partner_created'),
            'data' => new PartnerResource($partner),
        ], 201);
    }

    public function logInteraction(LogInteractionRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        $interaction = $this->crm->logInteraction($user, $request->validated());

        return response()->json([
            'message' => __('messages.crm.interaction_logged'),
            'data' => new CrmInteractionResource($interaction),
        ], 201);
    }

    public function getInteractions(Request $request): AnonymousResourceCollection
    {
        $items = $this->crm->interactionTimeline(
            $request->filled('client_id') ? $request->integer('client_id') : null,
            $request->filled('partner_id') ? $request->integer('partner_id') : null,
            min((int) $request->query('limit', 50), 100),
        );

        return CrmInteractionResource::collection($items);
    }

    public function getDeals(Request $request): AnonymousResourceCollection
    {
        $query = Deal::query()
            ->with(['client:id,name,company', 'owner:id,name'])
            ->orderByDesc('updated_at');

        if ($request->filled('stage')) {
            $query->where('stage', $request->string('stage'));
        }

        if ($request->filled('client_id')) {
            $query->where('client_id', $request->integer('client_id'));
        }

        return DealResource::collection($query->get());
    }

    public function addDeal(StoreDealRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        if (! $this->crm->canManage($user)) {
            return response()->json(['message' => __('messages.crm.forbidden')], 403);
        }

        $deal = $this->crm->addDeal($user, $request->validated());

        return response()->json([
            'message' => __('messages.crm.deal_created'),
            'data' => new DealResource($deal),
        ], 201);
    }

    public function updateDealStatus(UpdateDealStatusRequest $request, Deal $deal): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        if (! $this->crm->canManage($user)) {
            return response()->json(['message' => __('messages.crm.forbidden')], 403);
        }

        $deal = $this->crm->updateDealStatus($user, $deal, $request->validated());

        return response()->json([
            'message' => __('messages.crm.deal_updated'),
            'data' => new DealResource($deal),
        ]);
    }

    public function syncIntegrations(SyncIntegrationsRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        if (! $this->crm->canManage($user)) {
            return response()->json(['message' => __('messages.crm.forbidden')], 403);
        }

        $result = $this->crm->syncExternalInteractions(
            $user,
            $request->string('source')->toString(),
            $request->input('interactions', []),
        );

        return response()->json([
            'message' => __('messages.crm.integration_synced'),
            'data' => $result,
        ]);
    }

    public function exportClients(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        if (! $this->crm->canManage($user)) {
            return response()->json(['message' => __('messages.crm.forbidden')], 403);
        }

        return response()->json([
            'data' => $this->crm->exportClients(
                $request->filled('status') ? $request->string('status')->toString() : null,
                $request->filled('company') ? $request->string('company')->toString() : null,
            ),
        ]);
    }

    public function exportPartners(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        if (! $this->crm->canManage($user)) {
            return response()->json(['message' => __('messages.crm.forbidden')], 403);
        }

        return response()->json([
            'data' => $this->crm->exportPartners(
                $request->filled('status') ? $request->string('status')->toString() : null,
            ),
        ]);
    }

    public function auditLogs(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        if (! $this->crm->canManage($user)) {
            return response()->json(['message' => __('messages.crm.forbidden')], 403);
        }

        $logs = CrmAuditLog::query()
            ->with('user:id,name')
            ->whereIn('entity_type', ['interaction', 'deal', 'integration'])
            ->orderByDesc('occurred_at')
            ->limit(min((int) $request->query('limit', 50), 100))
            ->get();

        return response()->json([
            'data' => $logs->map(fn ($l) => [
                'id' => $l->id,
                'action' => $l->action,
                'entity_type' => $l->entity_type,
                'entity_id' => $l->entity_id,
                'description' => $l->description,
                'meta' => $l->meta,
                'user' => $l->user ? ['id' => $l->user->id, 'name' => $l->user->name] : null,
                'occurred_at' => $l->occurred_at?->toIso8601String(),
            ]),
        ]);
    }
}
