<?php

namespace App\Services;

use App\Enums\EvaluationStatus;
use App\Enums\RequestStatus;
use App\Enums\TrainingStatus;
use App\Models\Badge;
use App\Models\Document;
use App\Models\Employee;
use App\Models\Evaluation;
use App\Models\InternalRequest;
use App\Models\PointTransaction;
use App\Models\Project;
use App\Models\Task;
use App\Models\Training;
use App\Models\User;
use App\Models\UserBadge;
use App\Models\UserChallengeProgress;
use App\Models\UserPoint;
use App\Models\WeeklyChallenge;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class GamificationService
{
    public const POINTS = [
        'request_submit' => 10,
        'request_approve' => 15,
        'training_complete' => 25,
        'evaluation_goal' => 30,
        'document_upload' => 10,
        'project_contribution' => 15,
    ];

    public function __construct(
        private NotificationService $notifications,
    ) {}

    public function awardPoints(
        int $userId,
        int $points,
        string $reason,
        ?string $sourceType = null,
        ?int $sourceId = null,
        ?array $meta = null,
    ): UserPoint {
        PointTransaction::create([
            'user_id' => $userId,
            'points' => $points,
            'reason' => $reason,
            'source_type' => $sourceType,
            'source_id' => $sourceId,
            'meta' => $meta,
        ]);

        $record = UserPoint::firstOrCreate(
            ['user_id' => $userId],
            ['total_points' => 0, 'level' => 1],
        );

        $record->total_points += $points;
        $record->level = $this->levelForPoints($record->total_points);
        $record->save();

        $this->checkAndAwardBadges($userId);
        $this->incrementChallengeProgress($userId, $reason);

        $this->notifications->notifyGamification(
            $userId,
            __('messages.gamification.points_earned_title'),
            __('messages.gamification.points_earned_body', ['points' => $points]),
        );

        return $record->fresh();
    }

    public function onRequestSubmitted(int $userId, int $requestId): void
    {
        $this->awardPoints($userId, self::POINTS['request_submit'], 'request_submit', 'request', $requestId);
    }

    public function onRequestApproved(int $approverId, int $requestId): void
    {
        $this->awardPoints($approverId, self::POINTS['request_approve'], 'request_approve', 'request', $requestId);
    }

    public function onTrainingCompleted(Training $training): void
    {
        $training->load('assignees');
        foreach ($training->assignees as $assignee) {
            $this->awardPoints(
                $assignee->id,
                self::POINTS['training_complete'],
                'training_complete',
                'training',
                $training->id,
            );
        }
    }

    public function onEvaluationGoal(Evaluation $evaluation): void
    {
        if ($evaluation->status !== EvaluationStatus::Finalized || (float) $evaluation->score < 4) {
            return;
        }

        $alreadyAwarded = PointTransaction::query()
            ->where('user_id', $evaluation->employee_id)
            ->where('reason', 'evaluation_goal')
            ->where('source_type', 'evaluation')
            ->where('source_id', $evaluation->id)
            ->exists();

        if ($alreadyAwarded) {
            return;
        }

        $this->awardPoints(
            $evaluation->employee_id,
            self::POINTS['evaluation_goal'],
            'evaluation_goal',
            'evaluation',
            $evaluation->id,
        );
    }

    public function onDocumentUploaded(int $userId, int $documentId): void
    {
        $this->awardPoints($userId, self::POINTS['document_upload'], 'document_upload', 'document', $documentId);
    }

    public function onProjectContribution(int $userId, int $projectId): void
    {
        $this->awardPoints($userId, self::POINTS['project_contribution'], 'project_contribution', 'project', $projectId);
    }

    public function checkAndAwardBadges(int $userId): array
    {
        $newlyEarned = [];
        $badges = Badge::all();
        $earnedIds = UserBadge::where('user_id', $userId)->pluck('badge_id')->all();

        foreach ($badges as $badge) {
            if (in_array($badge->id, $earnedIds, true)) {
                continue;
            }

            if ($this->meetsCriteria($userId, $badge)) {
                UserBadge::create([
                    'user_id' => $userId,
                    'badge_id' => $badge->id,
                    'earned_at' => now(),
                ]);

                if ($badge->points_reward > 0) {
                    $this->addPointsOnly($userId, $badge->points_reward, 'badge_'.$badge->code, 'badge', $badge->id);
                }

                $this->notifications->notifyGamification(
                    $userId,
                    __('messages.gamification.badge_earned_title'),
                    __('messages.gamification.badge_earned_body', ['title' => $badge->title]),
                );

                $newlyEarned[] = $badge;
            }
        }

        return $newlyEarned;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function getBadgesForUser(User $user): array
    {
        $earned = UserBadge::where('user_id', $user->id)
            ->pluck('earned_at', 'badge_id');

        return Badge::orderBy('title')->get()->map(fn (Badge $badge) => [
            'id' => $badge->id,
            'code' => $badge->code,
            'title' => $badge->title,
            'description' => $badge->description,
            'icon' => $badge->icon,
            'color' => $badge->color,
            'points_reward' => $badge->points_reward,
            'criteria_key' => $badge->criteria_key,
            'criteria_value' => $badge->criteria_value,
            'earned' => $earned->has($badge->id),
            'earned_at' => $earned->get($badge->id)?->toIso8601String(),
        ])->all();
    }

    public function getPointsForUser(User $user): array
    {
        $record = UserPoint::firstOrCreate(
            ['user_id' => $user->id],
            ['total_points' => 0, 'level' => 1],
        );

        $history = PointTransaction::where('user_id', $user->id)
            ->latest()
            ->limit(20)
            ->get()
            ->map(fn ($t) => [
                'id' => $t->id,
                'points' => $t->points,
                'reason' => $t->reason,
                'created_at' => $t->created_at?->toIso8601String(),
            ]);

        $nextLevelAt = $this->pointsForLevel($record->level + 1);
        $currentLevelAt = $this->pointsForLevel($record->level);
        $progress = $nextLevelAt > $currentLevelAt
            ? min(100, (int) round((($record->total_points - $currentLevelAt) / ($nextLevelAt - $currentLevelAt)) * 100))
            : 100;

        return [
            'total_points' => $record->total_points,
            'level' => $record->level,
            'next_level_at' => $nextLevelAt,
            'progress_percent' => $progress,
            'history' => $history,
        ];
    }

    /**
     * @return array{employees: array, departments: array, user_rank: int|null}
     */
    public function getLeaderboard(User $user, string $scope = 'company'): array
    {
        $employees = $this->employeeLeaderboard();
        $departments = $this->departmentLeaderboard();

        $userRank = collect($employees)->search(fn ($row) => $row['user_id'] === $user->id);

        return [
            'employees' => $scope === 'department'
                ? collect($employees)->filter(fn ($row) => $row['department'] === $this->userDepartment($user))->values()->all()
                : $employees,
            'departments' => $departments,
            'user_rank' => $userRank !== false ? $userRank + 1 : null,
        ];
    }

    public function getOverview(User $user): array
    {
        $points = $this->getPointsForUser($user);
        $badges = $this->getBadgesForUser($user);
        $earnedCount = collect($badges)->where('earned', true)->count();
        $leaderboard = $this->getLeaderboard($user);

        return [
            'stats' => [
                'total_points' => $points['total_points'],
                'level' => $points['level'],
                'badges_earned' => $earnedCount,
                'badges_total' => count($badges),
                'company_rank' => $leaderboard['user_rank'],
            ],
            'points' => $points,
            'badges' => $badges,
            'challenges' => $this->activeChallengesForUser($user),
            'leaderboard_preview' => array_slice($leaderboard['employees'], 0, 5),
        ];
    }

    public function statsForDashboard(User $user): array
    {
        $points = UserPoint::where('user_id', $user->id)->first();
        $badgesEarned = UserBadge::where('user_id', $user->id)->count();

        return [
            'total_points' => $points?->total_points ?? 0,
            'level' => $points?->level ?? 1,
            'badges_earned' => $badgesEarned,
            'company_rank' => $this->getLeaderboard($user)['user_rank'],
        ];
    }

    private function meetsCriteria(int $userId, Badge $badge): bool
    {
        return match ($badge->criteria_key) {
            'requests_submitted' => InternalRequest::where('employee_id', $userId)->count() >= $badge->criteria_value,
            'requests_approved' => InternalRequest::where('approver_id', $userId)
                ->where('status', RequestStatus::Approved)->count() >= $badge->criteria_value,
            'trainings_completed' => $this->completedTrainingsCount($userId) >= $badge->criteria_value,
            'evaluations_high_score' => Evaluation::where('employee_id', $userId)
                ->where('status', EvaluationStatus::Finalized)
                ->where('score', '>=', 4)
                ->count() >= $badge->criteria_value,
            'documents_uploaded' => Document::where('employee_id', $userId)->count() >= $badge->criteria_value,
            'total_points' => (UserPoint::where('user_id', $userId)->value('total_points') ?? 0) >= $badge->criteria_value,
            'projects_active' => Project::where('manager_id', $userId)
                ->where('status', \App\Enums\ProjectStatus::Active)->count() >= $badge->criteria_value,
            default => false,
        };
    }

    private function completedTrainingsCount(int $userId): int
    {
        return Training::where('status', TrainingStatus::Completed)
            ->where(function ($q) use ($userId) {
                $q->where('trainer_id', $userId)
                    ->orWhereHas('assignees', fn ($aq) => $aq->where('users.id', $userId));
            })
            ->count();
    }

    private function incrementChallengeProgress(int $userId, string $reason): void
    {
        $challenges = WeeklyChallenge::query()
            ->where('is_active', true)
            ->where('week_start', '<=', Carbon::today())
            ->where('week_end', '>=', Carbon::today())
            ->where('action_type', $reason)
            ->get();

        $user = User::find($userId);
        $department = $user ? $this->userDepartment($user) : null;

        foreach ($challenges as $challenge) {
            if ($challenge->department && $challenge->department !== $department) {
                continue;
            }

            $progress = UserChallengeProgress::firstOrCreate(
                [
                    'user_id' => $userId,
                    'weekly_challenge_id' => $challenge->id,
                ],
                ['progress' => 0],
            );

            if ($progress->completed_at) {
                continue;
            }

            $progress->progress += 1;
            if ($progress->progress >= $challenge->target_count) {
                $progress->completed_at = now();
                $progress->save();

                $this->addPointsOnly(
                    $userId,
                    $challenge->points_reward,
                    'challenge_'.$challenge->code,
                    'challenge',
                    $challenge->id,
                );
                $this->checkAndAwardBadges($userId);

                $this->notifications->notifyGamification(
                    $userId,
                    __('messages.gamification.challenge_complete_title'),
                    __('messages.gamification.challenge_complete_body', ['title' => $challenge->title]),
                );
            } else {
                $progress->save();
            }
        }
    }

    private function addPointsOnly(
        int $userId,
        int $points,
        string $reason,
        ?string $sourceType = null,
        ?int $sourceId = null,
    ): UserPoint {
        PointTransaction::create([
            'user_id' => $userId,
            'points' => $points,
            'reason' => $reason,
            'source_type' => $sourceType,
            'source_id' => $sourceId,
        ]);

        $record = UserPoint::firstOrCreate(
            ['user_id' => $userId],
            ['total_points' => 0, 'level' => 1],
        );
        $record->total_points += $points;
        $record->level = $this->levelForPoints($record->total_points);
        $record->save();

        $this->notifications->notifyGamification(
            $userId,
            __('messages.gamification.points_earned_title'),
            __('messages.gamification.points_earned_body', ['points' => $points]),
        );

        return $record->fresh();
    }

    private function levelForPoints(int $points): int
    {
        return max(1, (int) floor($points / 100) + 1);
    }

    private function pointsForLevel(int $level): int
    {
        return ($level - 1) * 100;
    }

    private function userDepartment(User $user): ?string
    {
        return Employee::where('email', $user->email)->value('department');
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function employeeLeaderboard(): array
    {
        return User::query()
            ->leftJoin('user_points', 'users.id', '=', 'user_points.user_id')
            ->leftJoin('employees', 'users.email', '=', 'employees.email')
            ->select([
                'users.id as user_id',
                'users.name',
                'employees.department',
                DB::raw('COALESCE(user_points.total_points, 0) as total_points'),
            ])
            ->orderByDesc('total_points')
            ->orderBy('users.name')
            ->get()
            ->values()
            ->map(fn ($row, $index) => [
                'rank' => $index + 1,
                'user_id' => $row->user_id,
                'name' => $row->name,
                'department' => $row->department ?? '—',
                'total_points' => (int) $row->total_points,
            ])
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function departmentLeaderboard(): array
    {
        return User::query()
            ->leftJoin('user_points', 'users.id', '=', 'user_points.user_id')
            ->leftJoin('employees', 'users.email', '=', 'employees.email')
            ->whereNotNull('employees.department')
            ->select([
                'employees.department',
                DB::raw('SUM(COALESCE(user_points.total_points, 0)) as total_points'),
                DB::raw('COUNT(users.id) as member_count'),
            ])
            ->groupBy('employees.department')
            ->orderByDesc('total_points')
            ->get()
            ->values()
            ->map(fn ($row, $index) => [
                'rank' => $index + 1,
                'department' => $row->department,
                'total_points' => (int) $row->total_points,
                'member_count' => (int) $row->member_count,
            ])
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function activeChallengesForUser(User $user): array
    {
        $department = $this->userDepartment($user);

        return WeeklyChallenge::query()
            ->where('is_active', true)
            ->where('week_start', '<=', Carbon::today())
            ->where('week_end', '>=', Carbon::today())
            ->where(function ($q) use ($department) {
                $q->whereNull('department')->orWhere('department', $department);
            })
            ->get()
            ->map(function (WeeklyChallenge $challenge) use ($user) {
                $progress = UserChallengeProgress::firstOrCreate(
                    [
                        'user_id' => $user->id,
                        'weekly_challenge_id' => $challenge->id,
                    ],
                    ['progress' => 0],
                );

                return [
                    'id' => $challenge->id,
                    'title' => $challenge->title,
                    'description' => $challenge->description,
                    'target_count' => $challenge->target_count,
                    'progress' => $progress->progress,
                    'points_reward' => $challenge->points_reward,
                    'department' => $challenge->department,
                    'completed' => $progress->completed_at !== null,
                    'week_end' => $challenge->week_end->format('Y-m-d'),
                ];
            })
            ->all();
    }
}
