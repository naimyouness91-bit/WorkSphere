<?php

namespace App\Services\Integrations;

use App\Enums\IntegrationService;
use App\Enums\IntegrationStatus;
use App\Enums\UserRole;
use App\Models\Integration;
use App\Models\IntegrationLog;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;

class IntegrationManager
{
    public function __construct(
        private SlackIntegrationService $slack,
        private TeamsIntegrationService $teams,
        private EmailIntegrationService $email,
        private CloudStorageIntegrationService $cloud,
        private GoogleCalendarIntegrationService $googleCalendar,
        private IntegrationLogWriter $logger,
        private WebhookLogService $webhookLogs,
        private IntegrationFailureHandler $failureHandler,
    ) {}

    public function connect(User $user, array $data): Integration
    {
        $service = $data['service_name'] instanceof IntegrationService
            ? $data['service_name']
            : IntegrationService::from($data['service_name']);

        $integration = Integration::updateOrCreate(
            ['service_name' => $service],
            [
                'api_key' => $data['api_key'] ?? null,
                'webhook_url' => $data['webhook_url'] ?? null,
                'status' => $data['status'] ?? IntegrationStatus::Inactive,
                'settings' => $data['settings'] ?? [],
                'created_by' => $user->id,
            ],
        );

        $this->webhookLogs->record(
            $service,
            'service_connected',
            ['status' => $integration->status->value],
        );

        return $integration;
    }

    public function sendMessage(IntegrationService $service, string $message, ?string $title = null): void
    {
        $integration = $this->requireActive($service);

        match ($service) {
            IntegrationService::Slack => $this->slack->sendNotification($integration, $message),
            IntegrationService::Teams => $this->teams->sendNotification(
                $integration,
                $title ?? 'WorkSphere',
                $message,
            ),
            default => throw new \InvalidArgumentException('Service does not support channel messages.'),
        };
    }

    public function sendEmailMessage(string $to, string $subject, string $body): void
    {
        $integration = $this->requireActive(IntegrationService::Email);
        $this->email->send($integration, $to, $subject, $body);
    }

    public function test(Integration $integration, ?string $testEmail = null): void
    {
        if (! $integration->isActive()) {
            throw new \RuntimeException('Integration must be active to test.');
        }

        try {
            match ($integration->service_name) {
                IntegrationService::Slack => $this->slack->test($integration),
                IntegrationService::Teams => $this->teams->test($integration),
                IntegrationService::Email => $this->email->test(
                    $integration,
                    $testEmail ?? $integration->settings['test_recipient'] ?? config('mail.from.address'),
                ),
                IntegrationService::GoogleCalendar => $this->googleCalendar->test($integration),
                IntegrationService::GoogleDrive, IntegrationService::Dropbox => $this->cloud->test($integration),
            };
        } catch (\Throwable $e) {
            $this->failureHandler->handle($integration, 'test', $e->getMessage());
            throw $e;
        }
    }

    public function notifySlack(Integration $integration, string $message): void
    {
        try {
            $this->slack->sendNotification($integration, $message);
        } catch (\Throwable $e) {
            $this->failureHandler->handle($integration, 'slack_notify', $e->getMessage());
            throw $e;
        }
    }

    public function notifyTeams(Integration $integration, string $title, string $text): void
    {
        try {
            $this->teams->sendNotification($integration, $title, $text);
        } catch (\Throwable $e) {
            $this->failureHandler->handle($integration, 'teams_notify', $e->getMessage());
            throw $e;
        }
    }

    public function sendEmail(Integration $integration, string $to, string $subject, string $body): void
    {
        try {
            $this->email->send($integration, $to, $subject, $body);
        } catch (\Throwable $e) {
            $this->failureHandler->handle($integration, 'email_send', $e->getMessage());
            throw $e;
        }
    }

    public function syncCalendars(): int
    {
        $count = 0;
        $google = Integration::query()
            ->where('service_name', IntegrationService::GoogleCalendar)
            ->where('status', IntegrationStatus::Active)
            ->first();

        if ($google) {
            $count += $this->googleCalendar->syncUpcoming($google);
        }

        return $count;
    }

    public function dashboardKpis(): array
    {
        $since = Carbon::now()->subDay();

        return [
            'active_integrations' => Integration::where('status', IntegrationStatus::Active)->count(),
            'total_integrations' => Integration::count(),
            'messages_sent' => IntegrationLog::query()
                ->whereIn('action', ['notification_sent', 'email_sent'])
                ->where('created_at', '>=', $since)
                ->count(),
            'failed_logs' => IntegrationLog::query()
                ->where('status', 'failed')
                ->where('created_at', '>=', $since)
                ->count(),
            'webhook_events' => \App\Models\WebhookLog::where('logged_at', '>=', $since)->count(),
            'last_sync_at' => Integration::whereNotNull('last_sync_at')
                ->orderByDesc('last_sync_at')
                ->value('last_sync_at'),
        ];
    }

    public function statsForDashboard(User $user): ?array
    {
        if ($user->role !== UserRole::Admin) {
            return null;
        }

        $kpis = $this->dashboardKpis();

        return [
            'active_integrations' => $kpis['active_integrations'],
            'messages_sent' => $kpis['messages_sent'],
            'failed_logs' => $kpis['failed_logs'],
        ];
    }

    public function exportSettings(): array
    {
        return Integration::query()
            ->orderBy('service_name')
            ->get()
            ->map(fn (Integration $i) => [
                'service_name' => $i->service_name->value,
                'status' => $i->status->value,
                'webhook_url' => $i->webhook_url,
                'has_api_key' => filled($i->api_key),
                'settings' => $this->redactSettings($i->settings ?? []),
                'last_sync_at' => $i->last_sync_at?->toIso8601String(),
            ])
            ->values()
            ->all();
    }

    public function exportActivityLogs(Request $request): array
    {
        $query = IntegrationLog::query()->with('integration')->latest();

        if ($request->filled('integration_id')) {
            $query->where('integration_id', $request->integer('integration_id'));
        }

        return $query->limit(5000)->get()->map(fn (IntegrationLog $log) => [
            'id' => $log->id,
            'service_name' => $log->integration?->service_name->value,
            'action' => $log->action,
            'message' => $log->message,
            'status' => $log->status,
            'timestamp' => $log->created_at?->toIso8601String(),
        ])->values()->all();
    }

    public function webhookLogs(Request $request)
    {
        return $this->webhookLogs->query($request);
    }

    public function exportWebhookLogs(Request $request): array
    {
        return $this->webhookLogs->export($request);
    }

    private function requireActive(IntegrationService $service): Integration
    {
        $integration = Integration::query()
            ->where('service_name', $service)
            ->where('status', IntegrationStatus::Active)
            ->first();

        if (! $integration) {
            throw new \RuntimeException("No active {$service->value} integration configured.");
        }

        return $integration;
    }

    private function redactSettings(array $settings): array
    {
        $redactKeys = ['smtp_password', 'api_secret', 'client_secret'];

        foreach ($redactKeys as $key) {
            if (isset($settings[$key])) {
                $settings[$key] = '***';
            }
        }

        return $settings;
    }
}
