<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\InternalRequest\StoreInternalRequestRequest;
use App\Http\Resources\AppNotificationResource;
use App\Http\Resources\InternalRequestResource;
use App\Models\InternalRequest;
use App\Services\HomeDashboardService;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MobileController extends Controller
{
    public function __construct(
        private HomeDashboardService $homeDashboard,
        private NotificationService $notifications,
    ) {}

    public function dashboard(Request $request): JsonResponse
    {
        $user = $request->user('api');
        $overview = $this->homeDashboard->overview($user);

        return response()->json([
            'data' => [
                'kpis' => [
                    'requests' => $overview['kpis']['pending_requests'],
                    'training' => $overview['kpis']['upcoming_trainings'],
                    'payroll' => $overview['kpis']['total_employees'] !== null
                        ? $overview['kpis']['total_employees']
                        : null,
                    'analytics' => $overview['kpis']['active_projects'],
                ],
                'full_kpis' => $overview['kpis'],
                'recent_activity' => $overview['recent_activity'],
            ],
        ]);
    }

    public function notifications(Request $request): JsonResponse
    {
        return app(NotificationController::class)->index($request);
    }

    public function storeRequest(StoreInternalRequestRequest $request): JsonResponse
    {
        $user = $request->user('api');

        $internalRequest = InternalRequest::create([
            ...$request->validated(),
            'status' => \App\Enums\RequestStatus::Pending,
            'employee_id' => $user->id,
        ]);

        $internalRequest->load(['employee', 'approver']);
        $this->notifications->notifyRequestCreated($internalRequest);

        return response()->json([
            'message' => __('messages.requests.submitted'),
            'data' => new InternalRequestResource($internalRequest),
        ], 201);
    }
}
