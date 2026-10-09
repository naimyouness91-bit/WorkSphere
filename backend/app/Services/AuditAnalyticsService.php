<?php

namespace App\Services;

use App\Models\AuditLog;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AuditAnalyticsService
{
    public function dashboardKpis(): array
    {
        $today = Carbon::today();

        return [
            'actions_logged_today' => AuditLog::whereDate('logged_at', $today)->count(),
            'most_active_users' => $this->mostActiveUsers(5),
            'top_modules' => $this->topModules(5),
        ];
    }

    public function securityAlerts(): array
    {
        $alerts = [];
        $since = Carbon::now()->subHour();

        $failedByIp = AuditLog::query()
            ->where('action', 'login_failed')
            ->where('logged_at', '>=', $since)
            ->select('ip_address', DB::raw('COUNT(*) as attempts'))
            ->whereNotNull('ip_address')
            ->groupBy('ip_address')
            ->having('attempts', '>=', 5)
            ->get();

        foreach ($failedByIp as $row) {
            $alerts[] = [
                'type' => 'failed_logins_ip',
                'severity' => 'high',
                'message' => __('messages.audit.alerts.failed_logins_ip', [
                    'ip' => $row->ip_address,
                    'count' => $row->attempts,
                ]),
                'ip_address' => $row->ip_address,
                'count' => (int) $row->attempts,
            ];
        }

        $failedDescriptions = AuditLog::query()
            ->where('action', 'login_failed')
            ->where('logged_at', '>=', $since)
            ->get(['description']);

        $emailCounts = [];
        foreach ($failedDescriptions as $log) {
            if (preg_match('/email:\s*(\S+)/i', $log->description, $matches)) {
                $email = strtolower($matches[1]);
                $emailCounts[$email] = ($emailCounts[$email] ?? 0) + 1;
            }
        }

        foreach ($emailCounts as $email => $count) {
            if ($count >= 5) {
                $alerts[] = [
                    'type' => 'failed_logins_email',
                    'severity' => 'high',
                    'message' => __('messages.audit.alerts.failed_logins_email', [
                        'email' => $email,
                        'count' => $count,
                    ]),
                    'email' => $email,
                    'count' => $count,
                ];
            }
        }

        $burstUsers = AuditLog::query()
            ->where('logged_at', '>=', $since)
            ->whereNotNull('user_id')
            ->whereNotIn('action', ['login_failed'])
            ->select('user_id', DB::raw('COUNT(*) as actions'))
            ->groupBy('user_id')
            ->having('actions', '>=', 50)
            ->with('user:id,name,email')
            ->get();

        foreach ($burstUsers as $row) {
            $alerts[] = [
                'type' => 'high_activity',
                'severity' => 'medium',
                'message' => __('messages.audit.alerts.high_activity', [
                    'name' => $row->user?->name ?? 'User #'.$row->user_id,
                    'count' => $row->actions,
                ]),
                'user_id' => $row->user_id,
                'count' => (int) $row->actions,
            ];
        }

        return $alerts;
    }

    private function mostActiveUsers(int $limit): array
    {
        return AuditLog::query()
            ->where('logged_at', '>=', Carbon::today()->subDays(7))
            ->whereNotNull('user_id')
            ->select('user_id', DB::raw('COUNT(*) as action_count'))
            ->groupBy('user_id')
            ->orderByDesc('action_count')
            ->limit($limit)
            ->with('user:id,name,email')
            ->get()
            ->map(fn (AuditLog $row) => [
                'user_id' => $row->user_id,
                'name' => $row->user?->name,
                'email' => $row->user?->email,
                'action_count' => (int) $row->action_count,
            ])
            ->values()
            ->all();
    }

    private function topModules(int $limit): array
    {
        return AuditLog::query()
            ->where('logged_at', '>=', Carbon::today()->subDays(7))
            ->select('module', DB::raw('COUNT(*) as change_count'))
            ->groupBy('module')
            ->orderByDesc('change_count')
            ->limit($limit)
            ->get()
            ->map(fn ($row) => [
                'module' => $row->module,
                'change_count' => (int) $row->change_count,
            ])
            ->values()
            ->all();
    }
}
