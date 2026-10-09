<?php

namespace App\Services;

use App\Enums\RequestStatus;
use App\Enums\RequestType;
use App\Enums\UserRole;
use App\Http\Resources\ActivityLogResource;
use App\Http\Resources\InternalRequestResource;
use App\Models\InternalRequest;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class AdminDashboardService
{
    public function __construct(
        private DashboardAnalyticsService $analytics,
        private ActivityLogService $activityLog,
        private DevOpsService $devops,
    ) {}

    public function getOverview(string $engagementPeriod = 'week'): array
    {
        return [
            'analytics' => array_merge(
                $this->analytics->getAnalytics(),
                [
                    'extended_kpis' => $this->extendedKpis(),
                    'user_engagement' => $this->userEngagement($engagementPeriod),
                ],
            ),
            'activity' => ActivityLogResource::collection(
                $this->activityLog->recent(20),
            )->resolve(),
            'devops' => [
                'metrics' => $this->devops->metricsForAdmin(),
                'recent_deployments' => $this->devops->listDeployments(null, 8),
            ],
        ];
    }

    public function getFilteredRequests(array $filters): array
    {
        $query = InternalRequest::query()
            ->with(['employee', 'approver'])
            ->latest();

        $this->applyRequestFilters($query, $filters);

        return InternalRequestResource::collection($query->get())->resolve();
    }

    private function applyRequestFilters(Builder $query, array $filters): void
    {
        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (! empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        if (! empty($filters['search'])) {
            $search = '%'.$filters['search'].'%';
            $query->whereHas('employee', function (Builder $q) use ($search) {
                $q->where('name', 'like', $search)
                    ->orWhere('email', 'like', $search);
            });
        }
    }

    private function extendedKpis(): array
    {
        $total = InternalRequest::count();
        $rejected = InternalRequest::where('status', RequestStatus::Rejected)->count();
        $resolved = InternalRequest::query()
            ->whereIn('status', [RequestStatus::Approved, RequestStatus::Rejected])
            ->get();

        $totalHours = 0;
        $resolvedCount = $resolved->count();

        foreach ($resolved as $request) {
            $totalHours += $request->created_at->diffInHours($request->updated_at);
        }

        $activeManagers = User::query()
            ->where('role', UserRole::Manager)
            ->whereHas('approvedRequests', function (Builder $q) {
                $q->where('updated_at', '>=', Carbon::now()->subDays(30));
            })
            ->count();

        $managerTotal = User::where('role', UserRole::Manager)->count();

        return [
            'avg_approval_time_hours' => $resolvedCount > 0
                ? round($totalHours / $resolvedCount, 1)
                : 0,
            'rejection_rate' => $total > 0
                ? round(($rejected / $total) * 100, 1)
                : 0,
            'active_managers' => $activeManagers,
            'total_managers' => $managerTotal,
        ];
    }

    private function userEngagement(string $period): array
    {
        $days = $period === 'day' ? 7 : 28;
        $start = Carbon::today()->subDays($days - 1);

        $driver = DB::connection()->getDriverName();
        $dateExpression = match ($driver) {
            'sqlite' => "strftime('%Y-%m-%d', activity_logs.created_at)",
            default => 'DATE(activity_logs.created_at)',
        };

        $raw = DB::table('activity_logs')
            ->join('users', 'activity_logs.user_id', '=', 'users.id')
            ->where('activity_logs.created_at', '>=', $start)
            ->select(
                DB::raw("{$dateExpression} as date"),
                'users.role',
                DB::raw('COUNT(DISTINCT activity_logs.user_id) as count'),
            )
            ->groupBy('date', 'users.role')
            ->get();

        $byDate = [];

        for ($i = 0; $i < $days; $i++) {
            $date = $start->copy()->addDays($i)->format('Y-m-d');
            $byDate[$date] = [
                'date' => $date,
                'admin' => 0,
                'manager' => 0,
                'employee' => 0,
            ];
        }

        foreach ($raw as $row) {
            $date = $row->date;
            $role = $row->role;
            if (isset($byDate[$date]) && in_array($role, ['admin', 'manager', 'employee'], true)) {
                $byDate[$date][$role] = (int) $row->count;
            }
        }

        return array_values($byDate);
    }
}
