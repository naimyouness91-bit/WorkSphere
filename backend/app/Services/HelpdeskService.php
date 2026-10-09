<?php

namespace App\Services;

use App\Enums\ConversationType;
use App\Enums\SlaStatus;
use App\Enums\TicketCategory;
use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use App\Enums\TicketUpdateType;
use App\Enums\UserRole;
use App\Models\KnowledgeArticle;
use App\Models\KnowledgeFaq;
use App\Models\SupportCategory;
use App\Models\Ticket;
use App\Models\TicketSla;
use App\Models\TicketUpdate;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class HelpdeskService
{
    /** @var array<string, array{response: int, resolution: int}> hours */
    private const SLA_HOURS = [
        'low' => ['response' => 24, 'resolution' => 72],
        'medium' => ['response' => 8, 'resolution' => 48],
        'high' => ['response' => 2, 'resolution' => 24],
    ];

    public function __construct(
        private NotificationService $notifications,
        private KnowledgeBaseService $knowledge,
        private ChatService $chat,
    ) {}

    public function canManage(User $user): bool
    {
        return in_array($user->role, [UserRole::Admin, UserRole::Manager], true);
    }

    public function overview(User $user): array
    {
        $this->processSlaEscalations();

        return [
            'stats' => $this->statsForDashboard($user),
            'categories' => SupportCategory::where('is_active', true)->orderBy('name')->get(['id', 'name', 'slug', 'description']),
        ];
    }

    /**
     * @return array{open_tickets: int, sla_breaches: int, resolved_tickets: int, at_risk: int}
     */
    public function statsForDashboard(User $user): array
    {
        $isEmployeeOnly = $user->role === UserRole::Employee;

        $ticketQuery = Ticket::query();
        if ($isEmployeeOnly) {
            $ticketQuery->where('employee_id', $user->id);
        }

        $open = (clone $ticketQuery)->whereIn('status', [TicketStatus::Open, TicketStatus::InProgress])->count();
        $resolved = (clone $ticketQuery)->whereIn('status', [TicketStatus::Resolved, TicketStatus::Closed])->count();

        $slaQuery = TicketSla::query()
            ->whereHas('ticket', function (Builder $q) use ($isEmployeeOnly, $user) {
                if ($isEmployeeOnly) {
                    $q->where('employee_id', $user->id);
                }
            });

        $breaches = (clone $slaQuery)->where('status', SlaStatus::Breached)->count();
        $atRisk = (clone $slaQuery)->where('status', SlaStatus::AtRisk)->count();

        return [
            'open_tickets' => $open,
            'sla_breaches' => $breaches,
            'resolved_tickets' => $resolved,
            'at_risk' => $atRisk,
        ];
    }

    public function createTicket(User $user, array $data): Ticket
    {
        $priority = TicketPriority::from($data['priority'] ?? 'medium');
        $categorySlug = $data['category'] ?? 'it';
        $supportCategory = $this->resolveSupportCategory($categorySlug, $data['support_category_id'] ?? null);

        $ticket = Ticket::create([
            'title' => $data['title'],
            'description' => $data['description'],
            'category' => TicketCategory::tryFrom($categorySlug) ?? TicketCategory::Other,
            'support_category_id' => $supportCategory?->id,
            'status' => TicketStatus::Open,
            'priority' => $priority,
            'employee_id' => $user->id,
        ]);

        $this->createSlaForTicket($ticket);
        $this->logUpdate($ticket, $user, TicketUpdateType::Created,
            __('messages.helpdesk.audit_created', ['title' => $ticket->title]));

        return $this->loadTicket($ticket);
    }

    public function assignTicket(User $actor, Ticket $ticket, ?int $assigneeId): Ticket
    {
        $previous = $ticket->assigned_to;
        $ticket->assigned_to = $assigneeId;
        $ticket->save();

        $this->recordFirstResponse($ticket);

        $assigneeName = $assigneeId
            ? User::find($assigneeId)?->name ?? 'Staff'
            : __('messages.helpdesk.unassigned');

        $this->logUpdate($ticket, $actor, TicketUpdateType::Assignment,
            __('messages.helpdesk.audit_assigned', ['name' => $assigneeName]),
            ['from' => $previous, 'to' => $assigneeId]);

        if ($assigneeId && $assigneeId !== $actor->id) {
            $this->notifications->notifyTicketAssigned($ticket, $assigneeId);
        }

        $this->refreshSlaStatus($ticket->fresh());

        return $this->loadTicket($ticket->fresh());
    }

    public function updateTicketStatus(User $actor, Ticket $ticket, TicketStatus $status, ?string $comment = null): Ticket
    {
        $previous = $ticket->status;
        $ticket->status = $status;
        $ticket->syncResolvedTimestamp();

        if (in_array($status, [TicketStatus::InProgress, TicketStatus::Resolved, TicketStatus::Closed], true)) {
            $this->recordFirstResponse($ticket);
        }

        $ticket->save();

        $this->logUpdate($ticket, $actor, TicketUpdateType::StatusChange,
            $comment ?? __('messages.helpdesk.audit_status', [
                'from' => $previous->value,
                'to' => $status->value,
            ]),
            ['from' => $previous->value, 'to' => $status->value]);

        if (in_array($status, [TicketStatus::Resolved, TicketStatus::Closed], true)) {
            $this->markSlaResolved($ticket);
            $this->notifications->notifyTicketResolved($ticket);
        }

        $this->refreshSlaStatus($ticket->fresh());

        return $this->loadTicket($ticket->fresh());
    }

    public function addComment(User $actor, Ticket $ticket, string $message): TicketUpdate
    {
        if ($this->canManage($actor)) {
            $this->recordFirstResponse($ticket);
        }

        return $this->logUpdate($ticket, $actor, TicketUpdateType::Comment, $message);
    }

    /**
     * @return array<string, mixed>
     */
    public function slaMetrics(?Ticket $ticket = null): array
    {
        $this->processSlaEscalations();

        if ($ticket) {
            $ticket->load('sla');
            $sla = $ticket->sla;
            if (! $sla) {
                return ['ticket_id' => $ticket->id, 'sla' => null];
            }

            $this->refreshSlaStatus($ticket->fresh());

            return [
                'ticket_id' => $ticket->id,
                'sla' => $this->formatSla($ticket->fresh()->sla),
            ];
        }

        $active = TicketSla::query()
            ->whereHas('ticket', fn ($q) => $q->whereNotIn('status', [TicketStatus::Resolved, TicketStatus::Closed]))
            ->get();

        foreach ($active as $sla) {
            $this->refreshSlaStatus($sla->ticket);
        }

        return [
            'summary' => [
                'on_track' => TicketSla::where('status', SlaStatus::OnTrack)->count(),
                'at_risk' => TicketSla::where('status', SlaStatus::AtRisk)->count(),
                'breached' => TicketSla::where('status', SlaStatus::Breached)->count(),
                'met' => TicketSla::where('status', SlaStatus::Met)->count(),
            ],
            'breached_tickets' => Ticket::query()
                ->whereHas('sla', fn ($q) => $q->where('status', SlaStatus::Breached))
                ->with(['employee:id,name', 'sla'])
                ->limit(20)
                ->get()
                ->map(fn (Ticket $t) => [
                    'id' => $t->id,
                    'title' => $t->title,
                    'priority' => $t->priority->value,
                    'sla' => $this->formatSla($t->sla),
                ]),
        ];
    }

    /**
     * @return array{articles: array, faqs: array}
     */
    public function suggestSolutions(Ticket $ticket, int $limit = 5): array
    {
        $query = trim($ticket->title.' '.$ticket->description);
        if ($query === '') {
            return ['articles' => [], 'faqs' => []];
        }

        $category = $ticket->supportCategory?->slug ?? $ticket->category->value;
        $search = $this->knowledge->search($query, $category);

        $articles = collect($search['articles'])->take($limit)->map(fn ($a) => [
            'id' => $a->id,
            'title' => $a->title,
            'category' => $a->category,
            'excerpt' => \Illuminate\Support\Str::limit(strip_tags($a->content), 160),
            'helpful_count' => $a->helpful_count,
        ])->values()->all();

        $faqs = collect($search['faqs'])->take($limit)->map(fn ($f) => [
            'id' => $f->id,
            'question' => $f->question,
            'answer' => \Illuminate\Support\Str::limit($f->answer, 200),
            'category' => $f->category,
        ])->values()->all();

        if (count($articles) < $limit) {
            $extra = KnowledgeArticle::query()
                ->where('is_current', true)
                ->when($category, fn ($q) => $q->where('category', $category))
                ->orderByDesc('helpful_count')
                ->limit($limit - count($articles))
                ->get()
                ->map(fn ($a) => [
                    'id' => $a->id,
                    'title' => $a->title,
                    'category' => $a->category,
                    'excerpt' => \Illuminate\Support\Str::limit(strip_tags($a->content), 160),
                    'helpful_count' => $a->helpful_count,
                ]);

            $existingIds = collect($articles)->pluck('id')->all();
            foreach ($extra as $row) {
                if (! in_array($row['id'], $existingIds, true)) {
                    $articles[] = $row;
                }
            }
        }

        return ['articles' => array_slice($articles, 0, $limit), 'faqs' => $faqs];
    }

    public function startLiveChat(User $user, Ticket $ticket, ?int $supportUserId = null): Ticket
    {
        if (! $this->canView($user, $ticket)) {
            throw new \RuntimeException('forbidden');
        }

        if ($ticket->conversation_id) {
            return $this->loadTicket($ticket);
        }

        $participantIds = [$ticket->employee_id];
        if ($ticket->assigned_to) {
            $participantIds[] = $ticket->assigned_to;
        } elseif ($supportUserId) {
            $participantIds[] = $supportUserId;
        } else {
            $manager = User::query()
                ->whereIn('role', [UserRole::Admin, UserRole::Manager])
                ->where('id', '!=', $user->id)
                ->value('id');
            if ($manager) {
                $participantIds[] = $manager;
            }
        }

        if ($user->id !== $ticket->employee_id && ! in_array($user->id, $participantIds, true)) {
            $participantIds[] = $user->id;
        }

        $conversation = $this->chat->createGroup(
            $user,
            __('messages.helpdesk.chat_title', ['id' => $ticket->id]),
            array_unique($participantIds),
        );

        $ticket->update(['conversation_id' => $conversation->id]);

        $this->logUpdate($ticket, $user, TicketUpdateType::Comment,
            __('messages.helpdesk.chat_started'));

        return $this->loadTicket($ticket->fresh());
    }

    public function processSlaEscalations(): int
    {
        $escalated = 0;
        $now = now();

        $slas = TicketSla::query()
            ->with('ticket')
            ->whereHas('ticket', fn ($q) => $q->whereNotIn('status', [TicketStatus::Resolved, TicketStatus::Closed]))
            ->get();

        foreach ($slas as $sla) {
            $this->refreshSlaStatus($sla->ticket, $sla);

            if ($sla->status !== SlaStatus::Breached) {
                continue;
            }

            $ticket = $sla->ticket;
            if ($ticket->sla_escalated) {
                continue;
            }

            $ticket->sla_escalated = true;
            $ticket->escalated_at = $now;

            if ($ticket->priority !== TicketPriority::High) {
                $ticket->priority = TicketPriority::High;
            }

            $ticket->save();

            $this->logUpdate($ticket, null, TicketUpdateType::Escalation,
                __('messages.helpdesk.audit_escalated'));

            $this->notifications->notifyTicketSlaBreached($ticket);
            $escalated++;
        }

        return $escalated;
    }

    public function loadTicket(Ticket $ticket): Ticket
    {
        return $ticket->load([
            'employee:id,name,email',
            'assignee:id,name,email',
            'supportCategory:id,name,slug,description',
            'sla',
            'updates.user:id,name',
            'conversation:id,name,type',
        ]);
    }

    public function canView(User $user, Ticket $ticket): bool
    {
        if ($this->canManage($user)) {
            return true;
        }

        return $ticket->isOwnedBy($user);
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function exportRows(?User $user, array $filters = []): Collection
    {
        $query = Ticket::query()
            ->with(['employee:id,name,email', 'assignee:id,name', 'supportCategory:id,name', 'sla']);

        if ($user && $user->role === UserRole::Employee) {
            $query->where('employee_id', $user->id);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (! empty($filters['priority'])) {
            $query->where('priority', $filters['priority']);
        }
        if (! empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        return $query->latest()->get()->map(fn (Ticket $t) => [
            'id' => $t->id,
            'title' => $t->title,
            'category' => $t->category->value,
            'support_category' => $t->supportCategory?->name,
            'priority' => $t->priority->value,
            'status' => $t->status->value,
            'employee' => $t->employee?->name,
            'assignee' => $t->assignee?->name,
            'sla_status' => $t->sla?->status->value,
            'created_at' => $t->created_at?->toIso8601String(),
            'resolved_at' => $t->resolved_at?->toIso8601String(),
        ]);
    }

    private function createSlaForTicket(Ticket $ticket): TicketSla
    {
        $hours = self::SLA_HOURS[$ticket->priority->value] ?? self::SLA_HOURS['medium'];
        $created = $ticket->created_at ?? now();

        return TicketSla::create([
            'ticket_id' => $ticket->id,
            'response_due_at' => $created->copy()->addHours($hours['response']),
            'resolution_due_at' => $created->copy()->addHours($hours['resolution']),
            'status' => SlaStatus::OnTrack,
        ]);
    }

    private function refreshSlaStatus(Ticket $ticket, ?TicketSla $sla = null): void
    {
        $sla ??= $ticket->sla;
        if (! $sla) {
            return;
        }

        if (in_array($ticket->status, [TicketStatus::Resolved, TicketStatus::Closed], true)) {
            if ($sla->status !== SlaStatus::Met) {
                $sla->update(['status' => SlaStatus::Met, 'resolved_at' => $ticket->resolved_at ?? now()]);
            }

            return;
        }

        $now = now();
        $status = SlaStatus::OnTrack;

        $responseBreached = ! $sla->responded_at && $now->gt($sla->response_due_at);
        $resolutionBreached = $now->gt($sla->resolution_due_at);

        if ($responseBreached || $resolutionBreached) {
            $status = SlaStatus::Breached;
        } else {
            $responseThreshold = $sla->response_due_at->copy()->subMinutes(
                (int) max(1, $sla->response_due_at->diffInMinutes($ticket->created_at) * 0.2)
            );
            $resolutionThreshold = $sla->resolution_due_at->copy()->subMinutes(
                (int) max(1, $sla->resolution_due_at->diffInMinutes($ticket->created_at) * 0.2)
            );

            if ($now->gte($responseThreshold) || $now->gte($resolutionThreshold)) {
                $status = SlaStatus::AtRisk;
            }
        }

        if ($sla->status !== $status) {
            $sla->update(['status' => $status]);
        }
    }

    private function recordFirstResponse(Ticket $ticket): void
    {
        if ($ticket->first_response_at) {
            return;
        }

        $ticket->first_response_at = now();
        $ticket->save();

        $sla = $ticket->sla;
        if ($sla && ! $sla->responded_at) {
            $sla->update(['responded_at' => now()]);
            $this->refreshSlaStatus($ticket->fresh());
        }
    }

    private function markSlaResolved(Ticket $ticket): void
    {
        $sla = $ticket->sla;
        if ($sla) {
            $sla->update([
                'resolved_at' => $ticket->resolved_at ?? now(),
                'status' => SlaStatus::Met,
            ]);
        }
    }

    private function logUpdate(
        Ticket $ticket,
        ?User $user,
        TicketUpdateType $type,
        string $message,
        ?array $meta = null,
    ): TicketUpdate {
        return TicketUpdate::create([
            'ticket_id' => $ticket->id,
            'user_id' => $user?->id,
            'type' => $type,
            'message' => $message,
            'meta' => $meta,
        ]);
    }

    private function resolveSupportCategory(string $slug, ?int $id): ?SupportCategory
    {
        if ($id) {
            return SupportCategory::find($id);
        }

        return SupportCategory::where('slug', $slug)->first()
            ?? SupportCategory::where('slug', 'other')->first();
    }

    /**
     * @return array<string, mixed>|null
     */
    private function formatSla(?TicketSla $sla): ?array
    {
        if (! $sla) {
            return null;
        }

        $now = now();

        return [
            'status' => $sla->status->value,
            'response_due_at' => $sla->response_due_at->toIso8601String(),
            'resolution_due_at' => $sla->resolution_due_at->toIso8601String(),
            'responded_at' => $sla->responded_at?->toIso8601String(),
            'resolved_at' => $sla->resolved_at?->toIso8601String(),
            'response_seconds_remaining' => $now->lt($sla->response_due_at)
                ? (int) $now->diffInSeconds($sla->response_due_at)
                : 0,
            'resolution_seconds_remaining' => $now->lt($sla->resolution_due_at)
                ? (int) $now->diffInSeconds($sla->resolution_due_at)
                : 0,
        ];
    }
}
