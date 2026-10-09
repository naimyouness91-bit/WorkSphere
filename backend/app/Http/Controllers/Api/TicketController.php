<?php

namespace App\Http\Controllers\Api;

use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Ticket\StoreTicketRequest;
use App\Http\Requests\Ticket\UpdateTicketRequest;
use App\Http\Resources\TicketResource;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TicketController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        /** @var User $user */
        $user = $request->user('api');

        $query = Ticket::query()
            ->with(['employee', 'assignee'])
            ->latest();

        if ($this->isEmployeeOnly($user)) {
            $query->where('employee_id', $user->id);
        }

        $this->applyFilters($query, $request);

        return TicketResource::collection($query->get());
    }

    public function store(StoreTicketRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        $validated = $request->validated();

        $ticket = Ticket::create([
            ...$validated,
            'employee_id' => $user->id,
            'status' => TicketStatus::Open,
            'priority' => $validated['priority'] ?? TicketPriority::Medium,
        ]);

        $ticket->load(['employee', 'assignee']);

        return response()->json([
            'message' => __('messages.tickets.created'),
            'data' => new TicketResource($ticket),
        ], 201);
    }

    public function show(Ticket $ticket): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        if (! $this->canView($user, $ticket)) {
            return response()->json(['message' => __('messages.tickets.forbidden')], 403);
        }

        $ticket->load(['employee', 'assignee']);

        return response()->json([
            'data' => new TicketResource($ticket),
        ]);
    }

    public function update(UpdateTicketRequest $request, Ticket $ticket): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        if (! $this->canManage($user)) {
            return response()->json(['message' => __('messages.tickets.forbidden')], 403);
        }

        $ticket->fill($request->validated());

        if ($request->has('status')) {
            $ticket->syncResolvedTimestamp();
        }

        $ticket->save();
        $ticket->load(['employee', 'assignee']);

        return response()->json([
            'message' => __('messages.tickets.updated'),
            'data' => new TicketResource($ticket),
        ]);
    }

    private function applyFilters(Builder $query, Request $request): void
    {
        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('category')) {
            $query->where('category', $request->string('category'));
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->string('priority'));
        }
    }

    private function isEmployeeOnly(User $user): bool
    {
        return $user->role === UserRole::Employee;
    }

    private function canManage(User $user): bool
    {
        return $user->hasAnyRole([
            UserRole::Admin->value,
            UserRole::Manager->value,
        ]);
    }

    private function canView(User $user, Ticket $ticket): bool
    {
        if ($this->canManage($user)) {
            return true;
        }

        return $ticket->isOwnedBy($user);
    }
}
