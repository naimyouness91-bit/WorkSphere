<?php

namespace App\Services;

use App\Enums\ClientStatus;
use App\Enums\CrmInteractionType;
use App\Enums\DealStage;
use App\Enums\DealStatus;
use App\Enums\PartnerStatus;
use App\Enums\UserRole;
use App\Models\Client;
use App\Models\CrmAuditLog;
use App\Models\CrmInteraction;
use App\Models\Deal;
use App\Models\Partner;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class CrmService
{
    public function __construct(
        private NotificationService $notifications,
    ) {}

    public function canManage(User $user): bool
    {
        return in_array($user->role, [UserRole::Admin, UserRole::Manager], true);
    }

    public function addClient(User $actor, array $data): Client
    {
        $client = Client::create([
            'name' => $data['name'],
            'company' => $data['company'],
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'] ?? null,
            'status' => $data['status'] ?? ClientStatus::Active,
            'owner_id' => $data['owner_id'] ?? $actor->id,
        ]);

        $this->audit($actor->id, 'client_created', 'client', $client->id,
            __('messages.crm.audit_client_created', ['name' => $client->name]));

        return $client->load('owner:id,name');
    }

    public function addPartner(User $actor, array $data): Partner
    {
        $partner = Partner::create([
            'name' => $data['name'],
            'organization' => $data['organization'],
            'contact_info' => $data['contact_info'] ?? null,
            'status' => $data['status'] ?? PartnerStatus::Active,
            'owner_id' => $data['owner_id'] ?? $actor->id,
        ]);

        $this->audit($actor->id, 'partner_created', 'partner', $partner->id,
            __('messages.crm.audit_partner_created', ['name' => $partner->name]));

        return $partner->load('owner:id,name');
    }

    public function logInteraction(User $actor, array $data): CrmInteraction
    {
        if (empty($data['client_id']) && empty($data['partner_id'])) {
            throw new \InvalidArgumentException('client_id or partner_id required');
        }

        $interaction = CrmInteraction::create([
            'client_id' => $data['client_id'] ?? null,
            'partner_id' => $data['partner_id'] ?? null,
            'type' => $data['type'],
            'notes' => $data['notes'] ?? null,
            'occurred_at' => $data['occurred_at'] ?? now(),
            'logged_by' => $actor->id,
            'source' => $data['source'] ?? 'manual',
            'external_id' => $data['external_id'] ?? null,
        ]);

        $interaction->load(['client:id,name,company', 'partner:id,name,organization', 'logger:id,name']);

        $this->audit($actor->id, 'interaction_logged', 'interaction', $interaction->id,
            __('messages.crm.audit_interaction_logged', ['type' => $interaction->type->value]),
            ['interaction_id' => $interaction->id]);

        return $interaction;
    }

    public function addDeal(User $actor, array $data): Deal
    {
        $deal = Deal::create([
            'client_id' => $data['client_id'],
            'title' => $data['title'],
            'value' => $data['value'] ?? 0,
            'stage' => $data['stage'] ?? DealStage::Prospect,
            'status' => DealStatus::Open,
            'owner_id' => $data['owner_id'] ?? $actor->id,
            'expected_close_date' => $data['expected_close_date'] ?? null,
        ]);

        $deal->load(['client:id,name,company', 'owner:id,name']);

        $this->audit($actor->id, 'deal_created', 'deal', $deal->id,
            __('messages.crm.audit_deal_created', ['title' => $deal->title]),
            ['value' => (float) $deal->value]);

        $this->notifications->notifyDealCreated($deal);

        return $deal;
    }

    public function updateDealStatus(User $actor, Deal $deal, array $data): Deal
    {
        $previousStage = $deal->stage;
        $updates = [];

        if (isset($data['stage'])) {
            $stage = DealStage::from($data['stage']);
            $updates['stage'] = $stage;

            if ($stage === DealStage::Closed) {
                $updates['closed_at'] = now();
                $updates['status'] = isset($data['status']) && $data['status'] === DealStatus::Lost->value
                    ? DealStatus::Lost
                    : DealStatus::Won;
            } else {
                $updates['status'] = DealStatus::Open;
                $updates['closed_at'] = null;
            }
        }

        if (isset($data['status']) && ($deal->stage === DealStage::Closed || ($updates['stage'] ?? null) === DealStage::Closed)) {
            $updates['status'] = DealStatus::from($data['status']);
        }

        $deal->update($updates);
        $deal->load(['client:id,name,company', 'owner:id,name']);

        $this->audit($actor->id, 'deal_updated', 'deal', $deal->id,
            __('messages.crm.audit_deal_updated', [
                'title' => $deal->title,
                'from' => $previousStage->value,
                'to' => $deal->stage->value,
            ]),
            ['status' => $deal->status->value]);

        if ($deal->stage === DealStage::Closed && $previousStage !== DealStage::Closed) {
            $this->notifications->notifyDealClosed($deal);
        }

        return $deal;
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     * @return array{created: int, skipped: int}
     */
    public function syncExternalInteractions(User $actor, string $source, array $items): array
    {
        $created = 0;
        $skipped = 0;

        foreach ($items as $item) {
            $externalId = $item['external_id'] ?? null;
            if ($externalId && CrmInteraction::where('source', $source)->where('external_id', $externalId)->exists()) {
                $skipped++;

                continue;
            }

            $type = $item['type'] ?? 'email';
            if (! in_array($type, CrmInteractionType::values(), true)) {
                $type = CrmInteractionType::Email->value;
            }

            $this->logInteraction($actor, [
                'client_id' => $item['client_id'] ?? null,
                'partner_id' => $item['partner_id'] ?? null,
                'type' => $type,
                'notes' => $item['notes'] ?? $item['subject'] ?? null,
                'occurred_at' => $item['occurred_at'] ?? $item['date'] ?? now(),
                'source' => $source,
                'external_id' => $externalId,
            ]);
            $created++;
        }

        $this->audit($actor->id, 'integration_sync', 'integration', null,
            __('messages.crm.audit_integration_sync', ['source' => $source, 'count' => $created]),
            ['created' => $created, 'skipped' => $skipped]);

        return ['created' => $created, 'skipped' => $skipped];
    }

    public function statsForDashboard(): array
    {
        return [
            'active_clients' => Client::where('status', ClientStatus::Active)->count(),
            'deals_in_pipeline' => Deal::where('status', DealStatus::Open)
                ->whereIn('stage', [DealStage::Prospect, DealStage::Negotiation])
                ->count(),
            'closed_deals' => Deal::where('stage', DealStage::Closed)
                ->where('status', DealStatus::Won)
                ->count(),
            'pipeline_value' => (float) Deal::where('status', DealStatus::Open)->sum('value'),
        ];
    }

    public function overview(): array
    {
        return [
            'stats' => $this->statsForDashboard(),
            'companies' => Client::distinct()->orderBy('company')->pluck('company')->all(),
            'deal_stages' => DealStage::pipeline(),
        ];
    }

    /**
     * @return Collection<int, CrmInteraction>
     */
    public function interactionTimeline(?int $clientId = null, ?int $partnerId = null, int $limit = 50): Collection
    {
        $query = CrmInteraction::query()
            ->with(['client:id,name,company', 'partner:id,name,organization', 'logger:id,name'])
            ->orderByDesc('occurred_at')
            ->limit($limit);

        if ($clientId) {
            $query->where('client_id', $clientId);
        }

        if ($partnerId) {
            $query->where('partner_id', $partnerId);
        }

        return $query->get();
    }

    public function audit(
        ?int $userId,
        string $action,
        string $entityType,
        ?int $entityId,
        string $description,
        ?array $meta = null,
    ): void {
        CrmAuditLog::create([
            'user_id' => $userId,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'description' => $description,
            'meta' => $meta,
            'occurred_at' => now(),
        ]);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function exportClients(?string $status = null, ?string $company = null): array
    {
        $query = Client::query()->orderBy('company');

        if ($status) {
            $query->where('status', $status);
        }

        if ($company) {
            $query->where('company', $company);
        }

        return $query->get()->map(fn (Client $c) => [
            'id' => $c->id,
            'name' => $c->name,
            'company' => $c->company,
            'email' => $c->email,
            'phone' => $c->phone,
            'status' => $c->status->value,
        ])->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function exportPartners(?string $status = null): array
    {
        $query = Partner::query()->orderBy('organization');

        if ($status) {
            $query->where('status', $status);
        }

        return $query->get()->map(fn (Partner $p) => [
            'id' => $p->id,
            'name' => $p->name,
            'organization' => $p->organization,
            'contact_info' => $p->contact_info,
            'status' => $p->status->value,
        ])->all();
    }
}
