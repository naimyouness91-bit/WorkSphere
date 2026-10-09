<?php

namespace App\Http\Controllers\Api;

use App\Enums\EvaluationStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Evaluation\StoreEvaluationRequest;
use App\Http\Requests\Evaluation\UpdateEvaluationRequest;
use App\Http\Resources\EvaluationResource;
use App\Models\Evaluation;
use App\Models\User;
use App\Services\EvaluationAnalyticsService;
use App\Services\GamificationService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class EvaluationController extends Controller
{
    public function __construct(private EvaluationAnalyticsService $analytics) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        /** @var User $user */
        $user = $request->user('api');

        $query = Evaluation::query()
            ->with(['employee', 'evaluator'])
            ->orderByDesc('updated_at');

        if ($this->isEmployeeOnly($user)) {
            $query->where('employee_id', $user->id)
                ->whereIn('status', [
                    EvaluationStatus::Submitted,
                    EvaluationStatus::Finalized,
                ]);
        }

        $this->applyFilters($query, $request);

        return EvaluationResource::collection($query->get());
    }

    public function summary(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        if (! $this->canManage($user)) {
            return response()->json(['message' => __('messages.evaluations.forbidden')], 403);
        }

        $query = Evaluation::query();
        $this->applyFilters($query, $request);

        $averages = $this->analytics->averagesForEmployees($query);
        $sorted = collect($averages['employee_averages'])->sortByDesc('average_score')->values();
        $topPerformers = $sorted->take(5)->values()->all();
        $needsImprovement = $sorted
            ->filter(fn (array $row) => $row['average_score'] < 3.0)
            ->take(5)
            ->values()
            ->all();

        return response()->json([
            'data' => [
                ...$averages,
                'top_performers' => $topPerformers,
                'needs_improvement' => $needsImprovement,
            ],
        ]);
    }

    public function departments(): JsonResponse
    {
        return response()->json([
            'data' => $this->analytics->departmentOptions(),
        ]);
    }

    public function store(StoreEvaluationRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        if (! $this->canManage($user)) {
            return response()->json(['message' => __('messages.evaluations.forbidden')], 403);
        }

        $validated = $request->validated();

        $evaluation = Evaluation::create([
            'employee_id' => $validated['employee_id'],
            'evaluator_id' => $user->id,
            'review_period' => $validated['review_period'],
            'score' => $validated['score'],
            'comments' => $validated['comments'] ?? null,
            'status' => $validated['status'] ?? EvaluationStatus::Draft,
        ]);

        $evaluation->load(['employee', 'evaluator']);

        return response()->json([
            'message' => __('messages.evaluations.created'),
            'data' => new EvaluationResource($evaluation),
        ], 201);
    }

    public function show(Evaluation $evaluation): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        if (! $this->canAccess($user, $evaluation)) {
            return response()->json(['message' => __('messages.evaluations.forbidden')], 403);
        }

        $evaluation->load(['employee', 'evaluator']);

        return response()->json([
            'data' => new EvaluationResource($evaluation),
        ]);
    }

    public function update(UpdateEvaluationRequest $request, Evaluation $evaluation): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        if (! $this->canManage($user)) {
            return response()->json(['message' => __('messages.evaluations.forbidden')], 403);
        }

        $evaluation->update($request->validated());
        $evaluation->load(['employee', 'evaluator']);

        $this->gamification->onEvaluationGoal($evaluation->fresh());

        return response()->json([
            'message' => __('messages.evaluations.updated'),
            'data' => new EvaluationResource($evaluation),
        ]);
    }

    private function applyFilters(Builder $query, Request $request): void
    {
        if ($request->filled('review_period')) {
            $query->where('review_period', $request->string('review_period'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->integer('employee_id'));
        }

        if ($request->filled('department') && $this->canManage($request->user('api'))) {
            $this->analytics->applyDepartmentFilter($query, $request->string('department'));
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

    private function canAccess(User $user, Evaluation $evaluation): bool
    {
        if ($this->canManage($user)) {
            return true;
        }

        return $evaluation->isOwnedBy($user) && $evaluation->isVisibleToEmployee();
    }
}
