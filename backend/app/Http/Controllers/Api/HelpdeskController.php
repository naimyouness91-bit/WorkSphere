<?php

namespace App\Http\Controllers\Api;

use App\Enums\TicketStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Helpdesk\AssignTicketRequest;
use App\Http\Requests\Helpdesk\StoreTicketCommentRequest;
use App\Http\Requests\Helpdesk\StoreTicketRequest;
use App\Http\Requests\Helpdesk\UpdateTicketStatusRequest;
use App\Http\Resources\HelpdeskTicketResource;
use App\Models\Ticket;
use App\Models\User;
use App\Services\HelpdeskService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class HelpdeskController extends Controller
{
    public function __construct(
        private HelpdeskService $helpdesk,
    ) {}

    public function overview(): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        return response()->json(['data' => $this->helpdesk->overview($user)]);
    }

    public function getTickets(Request $request): AnonymousResourceCollection
    {
        /** @var User $user */
        $user = $request->user('api');

        $query = Ticket::query()
            ->with(['employee:id,name,email', 'assignee:id,name,email', 'supportCategory:id,name,slug', 'sla'])
            ->latest();

        if ($user->role->value === 'employee') {
            $query->where('employee_id', $user->id);
        }

        $this->applyFilters($query, $request);

        return HelpdeskTicketResource::collection($query->get());
    }

    public function createTicket(StoreTicketRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        $ticket = $this->helpdesk->createTicket($user, $request->validated());

        return response()->json([
            'message' => __('messages.helpdesk.created'),
            'data' => new HelpdeskTicketResource($ticket),
        ], 201);
    }

    public function show(Ticket $ticket): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        if (! $this->helpdesk->canView($user, $ticket)) {
            return response()->json(['message' => __('messages.helpdesk.forbidden')], 403);
        }

        return response()->json([
            'data' => new HelpdeskTicketResource($this->helpdesk->loadTicket($ticket)),
        ]);
    }

    public function assignTicket(AssignTicketRequest $request, Ticket $ticket): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        if (! $this->helpdesk->canManage($user)) {
            return response()->json(['message' => __('messages.helpdesk.forbidden')], 403);
        }

        $ticket = $this->helpdesk->assignTicket($user, $ticket, $request->validated('assigned_to'));

        return response()->json([
            'message' => __('messages.helpdesk.assigned'),
            'data' => new HelpdeskTicketResource($ticket),
        ]);
    }

    public function updateTicketStatus(UpdateTicketStatusRequest $request, Ticket $ticket): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        if (! $this->helpdesk->canManage($user) && ! $ticket->isOwnedBy($user)) {
            return response()->json(['message' => __('messages.helpdesk.forbidden')], 403);
        }

        $status = TicketStatus::from($request->validated('status'));

        if (! $this->helpdesk->canManage($user) && $status !== TicketStatus::Closed) {
            return response()->json(['message' => __('messages.helpdesk.forbidden')], 403);
        }

        $ticket = $this->helpdesk->updateTicketStatus(
            $user,
            $ticket,
            $status,
            $request->validated('comment'),
        );

        return response()->json([
            'message' => __('messages.helpdesk.updated'),
            'data' => new HelpdeskTicketResource($ticket),
        ]);
    }

    public function addComment(StoreTicketCommentRequest $request, Ticket $ticket): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        if (! $this->helpdesk->canView($user, $ticket)) {
            return response()->json(['message' => __('messages.helpdesk.forbidden')], 403);
        }

        $update = $this->helpdesk->addComment($user, $ticket, $request->validated('message'));
        $ticket = $this->helpdesk->loadTicket($ticket->fresh());

        return response()->json([
            'message' => __('messages.helpdesk.comment_added'),
            'data' => new HelpdeskTicketResource($ticket),
        ]);
    }

    public function getSLA(Request $request): JsonResponse
    {
        $ticket = null;
        if ($request->filled('ticket_id')) {
            $ticket = Ticket::find($request->integer('ticket_id'));
            if (! $ticket) {
                return response()->json(['message' => __('messages.common.not_found')], 404);
            }

            /** @var User $user */
            $user = auth('api')->user();
            if (! $this->helpdesk->canView($user, $ticket)) {
                return response()->json(['message' => __('messages.helpdesk.forbidden')], 403);
            }
        }

        return response()->json(['data' => $this->helpdesk->slaMetrics($ticket)]);
    }

    public function suggestions(Ticket $ticket): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        if (! $this->helpdesk->canView($user, $ticket)) {
            return response()->json(['message' => __('messages.helpdesk.forbidden')], 403);
        }

        return response()->json(['data' => $this->helpdesk->suggestSolutions($ticket)]);
    }

    public function startChat(Request $request, Ticket $ticket): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        if (! $this->helpdesk->canView($user, $ticket)) {
            return response()->json(['message' => __('messages.helpdesk.forbidden')], 403);
        }

        try {
            $ticket = $this->helpdesk->startLiveChat(
                $user,
                $ticket,
                $request->integer('support_user_id') ?: null,
            );
        } catch (\RuntimeException) {
            return response()->json(['message' => __('messages.helpdesk.forbidden')], 403);
        }

        return response()->json([
            'message' => __('messages.helpdesk.chat_ready'),
            'data' => new HelpdeskTicketResource($ticket),
        ]);
    }

    public function export(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        $rows = $this->helpdesk->exportRows($user, $request->only(['status', 'priority', 'category']));

        return response()->json(['data' => $rows->values()]);
    }

    public function categories(): JsonResponse
    {
        return response()->json([
            'data' => \App\Models\SupportCategory::where('is_active', true)->orderBy('name')->get(),
        ]);
    }

    private function applyFilters(Builder $query, Request $request): void
    {
        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('category')) {
            $query->where(function ($q) use ($request) {
                $q->where('category', $request->string('category'))
                    ->orWhereHas('supportCategory', fn ($sq) => $sq->where('slug', $request->string('category')));
            });
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->string('priority'));
        }

        if ($request->filled('support_category_id')) {
            $query->where('support_category_id', $request->integer('support_category_id'));
        }
    }
}
