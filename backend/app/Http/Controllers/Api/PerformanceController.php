<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Performance\StoreFeedback360Request;
use App\Http\Requests\Performance\StoreGoalRequest;
use App\Http\Requests\Performance\StoreReviewRequest;
use App\Http\Resources\Feedback360Resource;
use App\Http\Resources\PerformanceGoalResource;
use App\Http\Resources\PerformanceReviewResource;
use App\Http\Resources\UserListResource;
use App\Models\Feedback360;
use App\Models\PerformanceGoal;
use App\Models\PerformanceReview;
use App\Models\User;
use App\Services\PerformanceManagementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PerformanceController extends Controller
{
    public function __construct(
        private PerformanceManagementService $performance,
    ) {}

    public function overview(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');
        $employeeId = $this->performance->resolveEmployeeId(
            $user,
            $request->integer('employee_id') ?: null,
        );

        $data = $this->performance->dashboardFor($user, $employeeId);

        return response()->json([
            'data' => [
                'employee_id' => $data['employee_id'],
                'performance_score' => $data['performance_score'],
                'kpis' => $data['kpis'],
                'goals' => PerformanceGoalResource::collection($data['goals']),
                'analytics' => $data['analytics'],
                'training_suggestions' => $data['training_suggestions'],
                'can_manage' => $data['can_manage'],
            ],
        ]);
    }

    public function getGoals(Request $request): AnonymousResourceCollection
    {
        /** @var User $user */
        $user = $request->user('api');
        $employeeId = $this->performance->resolveEmployeeId(
            $user,
            $request->integer('employee_id') ?: null,
        );

        $goals = PerformanceGoal::query()
            ->with('creator:id,name')
            ->where('employee_id', $employeeId)
            ->orderBy('target_date')
            ->get();

        return PerformanceGoalResource::collection($goals);
    }

    public function addGoal(StoreGoalRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        if (! $this->performance->canManage($user)) {
            return response()->json(['message' => __('messages.performance.forbidden')], 403);
        }

        $goal = $this->performance->addGoal($user, $request->validated());

        return response()->json([
            'message' => __('messages.performance.goal_created'),
            'data' => new PerformanceGoalResource($goal),
        ], 201);
    }

    public function getReviews(Request $request): AnonymousResourceCollection
    {
        /** @var User $user */
        $user = $request->user('api');
        $employeeId = $this->performance->resolveEmployeeId(
            $user,
            $request->integer('employee_id') ?: null,
        );

        $reviews = PerformanceReview::query()
            ->with(['reviewer:id,name', 'employee:id,name'])
            ->where('employee_id', $employeeId)
            ->orderByDesc('review_date')
            ->get();

        return PerformanceReviewResource::collection($reviews);
    }

    public function addReview(StoreReviewRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        if (! $this->performance->canManage($user)) {
            return response()->json(['message' => __('messages.performance.forbidden')], 403);
        }

        $review = $this->performance->addReview($user, $request->validated());

        return response()->json([
            'message' => __('messages.performance.review_submitted'),
            'data' => new PerformanceReviewResource($review),
        ], 201);
    }

    public function getFeedback360(Request $request): AnonymousResourceCollection
    {
        /** @var User $user */
        $user = $request->user('api');
        $employeeId = $this->performance->resolveEmployeeId(
            $user,
            $request->integer('employee_id') ?: null,
        );

        $items = Feedback360::query()
            ->with('fromUser:id,name')
            ->where('employee_id', $employeeId)
            ->orderByDesc('feedback_date')
            ->get()
            ->map(function (Feedback360 $feedback) use ($user) {
                if ($feedback->is_anonymous && ! $this->performance->canManage($user)) {
                    if ($user->id !== $feedback->from_user_id) {
                        $feedback->setAttribute('mask_anonymous', true);
                        $feedback->unsetRelation('fromUser');
                    }
                } elseif ($feedback->is_anonymous && $user->id === $feedback->employee_id) {
                    $feedback->setAttribute('mask_anonymous', true);
                    $feedback->unsetRelation('fromUser');
                }

                return $feedback;
            });

        return Feedback360Resource::collection($items);
    }

    public function addFeedback360(StoreFeedback360Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');
        $validated = $request->validated();

        if ($validated['employee_id'] === $user->id) {
            return response()->json(['message' => __('messages.performance.cannot_self_feedback')], 422);
        }

        $feedback = $this->performance->addFeedback360($user, $validated);

        return response()->json([
            'message' => __('messages.performance.feedback_submitted'),
            'data' => new Feedback360Resource($feedback),
        ], 201);
    }

    public function history(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');
        $employeeId = $this->performance->resolveEmployeeId(
            $user,
            $request->integer('employee_id') ?: null,
        );

        $items = $this->performance->history($employeeId, min((int) $request->query('limit', 50), 100));

        return response()->json([
            'data' => $items->map(fn ($h) => [
                'id' => $h->id,
                'action' => $h->action,
                'entity_type' => $h->entity_type,
                'description' => $h->description,
                'meta' => $h->meta,
                'actor' => $h->actor ? ['id' => $h->actor->id, 'name' => $h->actor->name] : null,
                'occurred_at' => $h->occurred_at?->toIso8601String(),
            ]),
        ]);
    }

    public function report(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        if (! $this->performance->canManage($user)) {
            return response()->json(['message' => __('messages.performance.forbidden')], 403);
        }

        $employeeId = $request->integer('employee_id');
        if (! $employeeId) {
            return response()->json(['message' => __('messages.performance.employee_required')], 422);
        }

        return response()->json([
            'data' => $this->performance->reportData($employeeId),
        ]);
    }

    public function colleagues(Request $request): AnonymousResourceCollection
    {
        /** @var User $user */
        $user = $request->user('api');

        $colleagues = User::query()
            ->where('id', '!=', $user->id)
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role']);

        return UserListResource::collection($colleagues);
    }

    public function trainingSuggestions(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');
        $employeeId = $this->performance->resolveEmployeeId(
            $user,
            $request->integer('employee_id') ?: null,
        );

        return response()->json([
            'data' => $this->performance->trainingSuggestions($employeeId),
        ]);
    }
}
