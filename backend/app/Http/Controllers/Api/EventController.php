<?php

namespace App\Http\Controllers\Api;

use App\Enums\EventStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Event\StoreEventRequest;
use App\Http\Requests\Event\UpdateEventRequest;
use App\Http\Resources\EventResource;
use App\Models\Event;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class EventController extends Controller
{
    public function __construct(private NotificationService $notifications) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        /** @var User $user */
        $user = $request->user('api');

        $query = Event::query()
            ->with('employee')
            ->orderBy('start_date');

        if ($this->isEmployeeOnly($user)) {
            $query->where('employee_id', $user->id);
        }

        $this->applyFilters($query, $request);

        return EventResource::collection($query->get());
    }

    public function store(StoreEventRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');
        $validated = $request->validated();

        $employeeId = $this->canViewAll($user) && isset($validated['employee_id'])
            ? $validated['employee_id']
            : $user->id;

        $event = Event::create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'type' => $validated['type'],
            'status' => $validated['status'] ?? EventStatus::Scheduled,
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'employee_id' => $employeeId,
        ]);

        $event->load('employee');

        $this->notifications->notifyEventCreated($event);

        app(\App\Services\Integrations\IntegrationBridgeService::class)->syncCalendarEvent($event);

        return response()->json([
            'message' => __('messages.events.created'),
            'data' => new EventResource($event),
        ], 201);
    }

    public function show(Event $event): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        if (! $this->canAccess($user, $event)) {
            return response()->json(['message' => __('messages.events.forbidden')], 403);
        }

        $event->load('employee');

        return response()->json([
            'data' => new EventResource($event),
        ]);
    }

    public function update(UpdateEventRequest $request, Event $event): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        if (! $this->canManage($user, $event)) {
            return response()->json(['message' => __('messages.events.forbidden')], 403);
        }

        $event->update($request->validated());
        $event->load('employee');

        $this->notifications->notifyEventUpdated($event, $user);

        return response()->json([
            'message' => __('messages.events.updated'),
            'data' => new EventResource($event),
        ]);
    }

    private function applyFilters(Builder $query, Request $request): void
    {
        if ($request->filled('employee_id') && $this->canViewAll($request->user('api'))) {
            $query->where('employee_id', $request->integer('employee_id'));
        }

        if ($request->filled('type')) {
            $query->where('type', $request->string('type'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('date_from')) {
            $query->where('end_date', '>=', $request->string('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->where('start_date', '<=', $request->string('date_to'));
        }
    }

    private function isEmployeeOnly(User $user): bool
    {
        return $user->role === UserRole::Employee;
    }

    private function canViewAll(User $user): bool
    {
        return $user->hasAnyRole([
            UserRole::Admin->value,
            UserRole::Manager->value,
        ]);
    }

    private function canAccess(User $user, Event $event): bool
    {
        if ($this->canViewAll($user)) {
            return true;
        }

        return $event->isOwnedBy($user);
    }

    private function canManage(User $user, Event $event): bool
    {
        if ($this->canViewAll($user)) {
            return true;
        }

        return $event->isOwnedBy($user);
    }
}
