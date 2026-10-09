<?php

namespace App\Http\Controllers\Api;

use App\Enums\RequestStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\InternalRequest\StoreInternalRequestRequest;
use App\Http\Requests\InternalRequest\UpdateInternalRequestRequest;
use App\Http\Resources\InternalRequestResource;
use App\Models\InternalRequest;
use App\Models\User;
use App\Enums\ActivityAction;
use App\Services\ActivityLogService;
use App\Services\GamificationService;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class RequestController extends Controller
{
    public function __construct(
        private NotificationService $notifications,
        private ActivityLogService $activityLog,
        private GamificationService $gamification,
    ) {}

    public function index(): AnonymousResourceCollection|JsonResponse
    {
        $user = auth('api')->user();

        $query = InternalRequest::query()
            ->with(['employee', 'approver'])
            ->latest();

        if ($this->isEmployeeOnly($user)) {
            $query->where('employee_id', $user->id);
        }

        return InternalRequestResource::collection($query->get());
    }

    public function store(StoreInternalRequestRequest $request): JsonResponse
    {
        $user = auth('api')->user();

        $internalRequest = InternalRequest::create([
            ...$request->validated(),
            'status' => RequestStatus::Pending,
            'employee_id' => $user->id,
        ]);

        $internalRequest->load(['employee', 'approver']);

        $this->notifications->notifyRequestCreated($internalRequest);

        $this->activityLog->log(
            $user,
            ActivityAction::RequestSubmitted,
            __('messages.activity.request_submitted', [
                'name' => $user->name,
                'title' => $internalRequest->title,
            ]),
            ['request_id' => $internalRequest->id, 'title' => $internalRequest->title],
        );

        $this->gamification->onRequestSubmitted($user->id, $internalRequest->id);

        return response()->json([
            'message' => __('messages.requests.submitted'),
            'data' => new InternalRequestResource($internalRequest),
        ], 201);
    }

    public function show(InternalRequest $internalRequest): JsonResponse
    {
        $user = auth('api')->user();

        if (! $this->canView($user, $internalRequest)) {
            return response()->json(['message' => __('messages.requests.forbidden')], 403);
        }

        $internalRequest->load(['employee', 'approver']);

        return response()->json([
            'data' => new InternalRequestResource($internalRequest),
        ]);
    }

    public function update(
        UpdateInternalRequestRequest $request,
        InternalRequest $internalRequest,
    ): JsonResponse {
        $user = auth('api')->user();

        if (! $this->canApprove($user)) {
            return response()->json(['message' => __('messages.common.forbidden')], 403);
        }

        if ($internalRequest->status !== RequestStatus::Pending) {
            return response()->json([
                'message' => __('messages.requests.not_pending'),
            ], 422);
        }

        $internalRequest->update([
            'status' => $request->validated('status'),
            'approver_id' => $user->id,
        ]);

        $internalRequest->load(['employee', 'approver']);

        $this->notifications->notifyRequestStatusChanged($internalRequest);

        $action = $internalRequest->status === RequestStatus::Approved
            ? ActivityAction::RequestApproved
            : ActivityAction::RequestRejected;

        $messageKey = $internalRequest->status === RequestStatus::Approved
            ? 'messages.activity.request_approved'
            : 'messages.activity.request_rejected';

        $this->activityLog->log(
            $user,
            $action,
            __($messageKey, [
                'admin' => $user->name,
                'title' => $internalRequest->title,
            ]),
            ['request_id' => $internalRequest->id, 'title' => $internalRequest->title],
        );

        if ($internalRequest->status === RequestStatus::Approved) {
            $this->gamification->onRequestApproved($user->id, $internalRequest->id);
        }

        $message = $internalRequest->status === RequestStatus::Approved
            ? __('messages.requests.approved')
            : __('messages.requests.rejected');

        return response()->json([
            'message' => $message,
            'data' => new InternalRequestResource($internalRequest),
        ]);
    }

    private function isEmployeeOnly(User $user): bool
    {
        return $user->role === UserRole::Employee;
    }

    private function canView(User $user, InternalRequest $internalRequest): bool
    {
        if ($this->canApprove($user)) {
            return true;
        }

        return $internalRequest->isOwnedBy($user);
    }

    private function canApprove(User $user): bool
    {
        return $user->hasAnyRole([
            UserRole::Admin->value,
            UserRole::Manager->value,
        ]);
    }
}
