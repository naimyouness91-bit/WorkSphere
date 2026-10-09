<?php

namespace App\Services;

use App\Enums\GoalStatus;
use App\Enums\TrainingStatus;
use App\Enums\UserRole;
use App\Models\Feedback360;
use App\Models\PerformanceGoal;
use App\Models\PerformanceHistory;
use App\Models\PerformanceReview;
use App\Models\Training;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class PerformanceManagementService
{
    public function __construct(
        private NotificationService $notifications,
    ) {}

    public function canManage(User $user): bool
    {
        return in_array($user->role, [UserRole::Admin, UserRole::Manager], true);
    }

    public function resolveEmployeeId(User $user, ?int $employeeId): int
    {
        if ($this->canManage($user) && $employeeId) {
            return $employeeId;
        }

        return $user->id;
    }

    public function addGoal(User $actor, array $data): PerformanceGoal
    {
        $status = isset($data['status'])
            ? GoalStatus::from($data['status'])
            : GoalStatus::Pending;

        $goal = PerformanceGoal::create([
            'employee_id' => $data['employee_id'],
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'target_date' => $data['target_date'],
            'status' => $status,
            'progress' => $data['progress'] ?? $status->defaultProgress(),
            'created_by' => $actor->id,
        ]);

        $goal->load(['employee:id,name', 'creator:id,name']);
        $this->recordHistory(
            $goal->employee_id,
            $actor->id,
            'goal_created',
            'goal',
            $goal->id,
            __('messages.performance.history_goal_created', ['title' => $goal->title]),
            ['goal_id' => $goal->id],
        );

        return $goal;
    }

    public function addReview(User $reviewer, array $data): PerformanceReview
    {
        $review = PerformanceReview::create([
            'employee_id' => $data['employee_id'],
            'reviewer_id' => $reviewer->id,
            'comments' => $data['comments'] ?? null,
            'rating' => $data['rating'],
            'review_date' => $data['review_date'] ?? Carbon::today()->toDateString(),
        ]);

        $review->load(['employee:id,name', 'reviewer:id,name']);
        $this->recordHistory(
            $review->employee_id,
            $reviewer->id,
            'review_submitted',
            'review',
            $review->id,
            __('messages.performance.history_review_submitted', [
                'reviewer' => $reviewer->name,
                'rating' => $review->rating,
            ]),
            ['review_id' => $review->id, 'rating' => (float) $review->rating],
        );

        $this->notifications->notifyPerformanceReviewSubmitted($review);

        return $review;
    }

    public function addFeedback360(User $fromUser, array $data): Feedback360
    {
        $feedback = Feedback360::create([
            'employee_id' => $data['employee_id'],
            'from_user_id' => $fromUser->id,
            'feedback_text' => $data['feedback_text'],
            'rating' => $data['rating'],
            'feedback_date' => $data['feedback_date'] ?? Carbon::today()->toDateString(),
            'is_anonymous' => $data['is_anonymous'] ?? false,
        ]);

        $feedback->load(['employee:id,name', 'fromUser:id,name']);
        $this->recordHistory(
            $feedback->employee_id,
            $fromUser->id,
            'feedback_360_submitted',
            'feedback_360',
            $feedback->id,
            __('messages.performance.history_feedback_submitted'),
            ['feedback_id' => $feedback->id, 'anonymous' => $feedback->is_anonymous],
        );

        $this->notifications->notifyFeedback360Submitted($feedback);

        return $feedback;
    }

    public function recordHistory(
        int $employeeId,
        ?int $userId,
        string $action,
        string $entityType,
        ?int $entityId,
        string $description,
        ?array $meta = null,
    ): void {
        PerformanceHistory::create([
            'employee_id' => $employeeId,
            'user_id' => $userId,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'description' => $description,
            'meta' => $meta,
            'occurred_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * @return array{score: float, goals_component: float, reviews_component: float, feedback_component: float, breakdown: array}
     */
    public function calculatePerformanceScore(int $employeeId): array
    {
        $goals = PerformanceGoal::where('employee_id', $employeeId)->get();
        $goalsTotal = $goals->count();
        $goalsAchieved = $goals->where('status', GoalStatus::Achieved)->count();
        $goalsProgress = $goals->avg('progress') ?? 0;
        $goalsComponent = $goalsTotal > 0
            ? round((($goalsAchieved / $goalsTotal) * 0.6 + ($goalsProgress / 100) * 0.4) * 100, 1)
            : 50.0;

        $avgReview = (float) PerformanceReview::where('employee_id', $employeeId)->avg('rating');
        $reviewsComponent = $avgReview > 0
            ? round(($avgReview / 5) * 100, 1)
            : 50.0;

        $avgFeedback = (float) Feedback360::where('employee_id', $employeeId)->avg('rating');
        $feedbackComponent = $avgFeedback > 0
            ? round(($avgFeedback / 5) * 100, 1)
            : 50.0;

        $score = round($goalsComponent * 0.4 + $reviewsComponent * 0.35 + $feedbackComponent * 0.25, 1);

        return [
            'score' => $score,
            'goals_component' => $goalsComponent,
            'reviews_component' => $reviewsComponent,
            'feedback_component' => $feedbackComponent,
            'breakdown' => [
                'goals_total' => $goalsTotal,
                'goals_achieved' => $goalsAchieved,
                'avg_review_rating' => round($avgReview, 2),
                'avg_feedback_rating' => round($avgFeedback, 2),
            ],
        ];
    }

    public function dashboardFor(User $viewer, int $employeeId): array
    {
        $score = $this->calculatePerformanceScore($employeeId);

        $goals = PerformanceGoal::query()
            ->with('creator:id,name')
            ->where('employee_id', $employeeId)
            ->orderBy('target_date')
            ->get();

        $goalsAchieved = $goals->where('status', GoalStatus::Achieved)->count();
        $avgRating = round(
            (float) PerformanceReview::where('employee_id', $employeeId)->avg('rating'),
            2,
        );
        $feedbackCount = Feedback360::where('employee_id', $employeeId)->count();

        return [
            'employee_id' => $employeeId,
            'performance_score' => $score,
            'kpis' => [
                'goals_achieved' => $goalsAchieved,
                'goals_total' => $goals->count(),
                'average_rating' => $avgRating,
                'feedback_count' => $feedbackCount,
            ],
            'goals' => $goals,
            'analytics' => $this->analytics($employeeId),
            'training_suggestions' => $this->trainingSuggestions($employeeId, $score),
            'can_manage' => $this->canManage($viewer),
        ];
    }

    /**
     * @return array{goal_completion_trend: array, rating_distribution: array}
     */
    public function analytics(int $employeeId): array
    {
        $months = collect();
        for ($i = 5; $i >= 0; $i--) {
            $months->push(Carbon::now()->subMonths($i)->format('Y-m'));
        }

        $goalTrend = $months->map(function (string $month) use ($employeeId) {
            $start = Carbon::createFromFormat('Y-m', $month)->startOfMonth();
            $end = $start->copy()->endOfMonth();

            $total = PerformanceGoal::where('employee_id', $employeeId)
                ->whereBetween('created_at', [$start, $end])
                ->count();

            $achieved = PerformanceGoal::where('employee_id', $employeeId)
                ->where('status', GoalStatus::Achieved)
                ->whereBetween('updated_at', [$start, $end])
                ->count();

            return [
                'month' => $month,
                'label' => $start->format('M Y'),
                'total' => $total,
                'achieved' => $achieved,
                'completion_rate' => $total > 0 ? round(($achieved / $total) * 100, 1) : 0,
            ];
        })->values()->all();

        $buckets = [1 => 0, 2 => 0, 3 => 0, 4 => 0, 5 => 0];

        PerformanceReview::where('employee_id', $employeeId)->each(function (PerformanceReview $r) use (&$buckets) {
            $key = (int) round((float) $r->rating);
            $key = max(1, min(5, $key));
            $buckets[$key]++;
        });

        Feedback360::where('employee_id', $employeeId)->each(function (Feedback360 $f) use (&$buckets) {
            $key = (int) round((float) $f->rating);
            $key = max(1, min(5, $key));
            $buckets[$key]++;
        });

        $ratingDistribution = collect($buckets)->map(fn ($count, $rating) => [
            'rating' => (int) $rating,
            'count' => $count,
        ])->values()->all();

        return [
            'goal_completion_trend' => $goalTrend,
            'rating_distribution' => $ratingDistribution,
        ];
    }

    /**
     * @return array<int, array{training_id: int|null, title: string, reason: string, priority: string}>
     */
    public function trainingSuggestions(int $employeeId, ?array $scoreData = null): array
    {
        $scoreData ??= $this->calculatePerformanceScore($employeeId);
        $suggestions = [];

        if ($scoreData['goals_component'] < 60) {
            $suggestions[] = [
                'training_id' => null,
                'title' => __('messages.performance.suggest_goal_setting'),
                'reason' => __('messages.performance.suggest_goal_setting_reason'),
                'priority' => 'high',
            ];
        }

        if ($scoreData['reviews_component'] < 65) {
            $suggestions[] = [
                'training_id' => null,
                'title' => __('messages.performance.suggest_core_skills'),
                'reason' => __('messages.performance.suggest_core_skills_reason'),
                'priority' => 'high',
            ];
        }

        if ($scoreData['feedback_component'] < 65) {
            $suggestions[] = [
                'training_id' => null,
                'title' => __('messages.performance.suggest_collaboration'),
                'reason' => __('messages.performance.suggest_collaboration_reason'),
                'priority' => 'medium',
            ];
        }

        $trainings = Training::query()
            ->where('status', TrainingStatus::Scheduled)
            ->where('start_date', '>=', Carbon::now())
            ->orderBy('start_date')
            ->limit(5)
            ->get();

        foreach ($trainings as $training) {
            if (count($suggestions) >= 5) {
                break;
            }
            $titleLower = strtolower($training->title);
            $gap = $scoreData['reviews_component'] < 65 && (
                str_contains($titleLower, 'skill')
                || str_contains($titleLower, 'leadership')
                || str_contains($titleLower, 'communication')
            );
            if ($gap || $scoreData['score'] < 70) {
                $suggestions[] = [
                    'training_id' => $training->id,
                    'title' => $training->title,
                    'reason' => __('messages.performance.suggest_scheduled_training', [
                        'date' => $training->start_date->format('Y-m-d'),
                    ]),
                    'priority' => 'medium',
                ];
            }
        }

        return array_slice($suggestions, 0, 5);
    }

    /**
     * @return Collection<int, PerformanceHistory>
     */
    public function history(int $employeeId, int $limit = 50): Collection
    {
        return PerformanceHistory::query()
            ->with('actor:id,name')
            ->where('employee_id', $employeeId)
            ->orderByDesc('occurred_at')
            ->limit($limit)
            ->get();
    }

    /**
     * @return array{employee: array, goals: array, reviews: array, feedback: array, score: array}
     */
    public function reportData(int $employeeId): array
    {
        $employee = User::findOrFail($employeeId);

        return [
            'employee' => ['id' => $employee->id, 'name' => $employee->name, 'email' => $employee->email],
            'goals' => PerformanceGoal::where('employee_id', $employeeId)->orderBy('target_date')->get()->all(),
            'reviews' => PerformanceReview::with('reviewer:id,name')
                ->where('employee_id', $employeeId)
                ->orderByDesc('review_date')
                ->get()
                ->all(),
            'feedback' => Feedback360::with('fromUser:id,name')
                ->where('employee_id', $employeeId)
                ->orderByDesc('feedback_date')
                ->get()
                ->all(),
            'score' => $this->calculatePerformanceScore($employeeId),
            'history' => $this->history($employeeId, 100)->all(),
        ];
    }

}
