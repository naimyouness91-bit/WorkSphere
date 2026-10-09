<?php

namespace App\Http\Controllers\Api;

use App\Enums\TrainingStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Training\StoreTrainingRequest;
use App\Http\Requests\Training\UpdateTrainingRequest;
use App\Http\Resources\TrainingResource;
use App\Models\Training;
use App\Models\User;
use App\Services\GamificationService;
use App\Services\NotificationService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TrainingController extends Controller
{
    public function __construct(
        private NotificationService $notifications,
        private GamificationService $gamification,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        /** @var User $user */
        $user = $request->user('api');

        $query = Training::query()
            ->with(['trainer', 'assignees'])
            ->orderBy('start_date');

        if ($this->isEmployeeOnly($user)) {
            $query->where(function (Builder $q) use ($user) {
                $q->where('trainer_id', $user->id)
                    ->orWhereHas('assignees', fn (Builder $aq) => $aq->where('users.id', $user->id));
            });
        }

        $this->applyFilters($query, $request);

        return TrainingResource::collection($query->get());
    }

    public function store(StoreTrainingRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        if (! $this->canManageTrainings($user)) {
            return response()->json(['message' => __('messages.trainings.forbidden')], 403);
        }

        $validated = $request->validated();
        $assigneeIds = $validated['assignee_ids'] ?? [];
        unset($validated['assignee_ids']);

        $training = Training::create([
            ...$validated,
            'status' => $validated['status'] ?? TrainingStatus::Scheduled,
        ]);

        if ($assigneeIds !== []) {
            $training->assignees()->sync($assigneeIds);
        }

        $training->load(['trainer', 'assignees']);

        if ($training->status === TrainingStatus::Scheduled) {
            $this->notifications->notifyTrainingScheduled($training, $assigneeIds);
        }

        return response()->json([
            'message' => __('messages.trainings.created'),
            'data' => new TrainingResource($training),
        ], 201);
    }

    public function show(Training $training): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        if (! $this->canAccess($user, $training)) {
            return response()->json(['message' => __('messages.trainings.forbidden')], 403);
        }

        $training->load(['trainer', 'assignees']);

        return response()->json([
            'data' => new TrainingResource($training),
        ]);
    }

    public function update(UpdateTrainingRequest $request, Training $training): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        if (! $this->canManageTrainings($user)) {
            return response()->json(['message' => __('messages.trainings.forbidden')], 403);
        }

        $validated = $request->validated();
        $assigneeIds = $validated['assignee_ids'] ?? null;
        unset($validated['assignee_ids']);

        $training->update($validated);

        if ($assigneeIds !== null) {
            $training->assignees()->sync($assigneeIds);
        }

        $training->load(['trainer', 'assignees']);

        if ($training->status === TrainingStatus::Scheduled) {
            $this->notifications->notifyTrainingScheduled(
                $training,
                $assigneeIds ?? $training->assignees->pluck('id')->all(),
            );
        }

        if ($previousStatus !== TrainingStatus::Completed && $training->status === TrainingStatus::Completed) {
            $this->gamification->onTrainingCompleted($training);
        }

        return response()->json([
            'message' => __('messages.trainings.updated'),
            'data' => new TrainingResource($training),
        ]);
    }

    public function destroy(Training $training): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        if (! $this->canManageTrainings($user)) {
            return response()->json(['message' => __('messages.trainings.forbidden')], 403);
        }

        $training->delete();

        return response()->json([
            'message' => __('messages.trainings.deleted'),
        ]);
    }

    private function applyFilters(Builder $query, Request $request): void
    {
        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('employee_id') && $this->canManageTrainings($request->user('api'))) {
            $employeeId = $request->integer('employee_id');
            $query->where(function (Builder $q) use ($employeeId) {
                $q->where('trainer_id', $employeeId)
                    ->orWhereHas('assignees', fn (Builder $aq) => $aq->where('users.id', $employeeId));
            });
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

    private function canManageTrainings(User $user): bool
    {
        return $user->hasAnyRole([
            UserRole::Admin->value,
            UserRole::Manager->value,
        ]);
    }

    private function canAccess(User $user, Training $training): bool
    {
        if ($this->canManageTrainings($user)) {
            return true;
        }

        return $training->isAssignedTo($user);
    }
}
