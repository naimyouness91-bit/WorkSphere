<?php

namespace App\Services\Integrations;

use App\Enums\IntegrationService;
use App\Enums\IntegrationStatus;
use App\Enums\UserRole;
use App\Models\Event;
use App\Models\Integration;
use App\Models\IntegrationLog;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class IntegrationBridgeService
{
    public function __construct(
        private IntegrationManager $integrations,
    ) {}

    public function notifyPayrollPublished(string $employeeName, string $amount, string $payDate): void
    {
        $title = __('messages.integrations.channels.payroll_title');
        $body = __('messages.integrations.channels.payroll_body', [
            'name' => $employeeName,
            'amount' => $amount,
            'date' => $payDate,
        ]);

        $this->broadcastHr($title, $body);
        $this->emailAdmins($title, $body, 'payroll');
    }

    public function notifyComplianceAlert(string $title, string $details): void
    {
        $this->broadcastHr($title, $details);
        $this->emailAdmins($title, $details, 'compliance');
    }

    public function notifyRecruitmentUpdate(string $title, string $details): void
    {
        $this->broadcastHr($title, $details);
        $this->emailAdmins($title, $details, 'recruitment');
    }

    public function notifyHr(string $title, string $message): void
    {
        $this->broadcastHr($title, $message);
    }

    public function syncCalendarEvent(Event $event): void
    {
        $google = $this->activeIntegration(IntegrationService::GoogleCalendar);
        if ($google) {
            try {
                app(GoogleCalendarIntegrationService::class)->syncEvent($google, $event);
            } catch (\Throwable $e) {
                Log::warning('Google Calendar sync failed: '.$e->getMessage());
            }
        }

        $teams = $this->activeIntegration(IntegrationService::Teams);
        if ($teams && ($teams->settings['sync_calendar'] ?? false)) {
            try {
                $this->integrations->notifyTeams(
                    $teams,
                    __('messages.integrations.channels.calendar_title'),
                    __('messages.integrations.channels.calendar_body', [
                        'title' => $event->title,
                        'start' => $event->start_date?->format('Y-m-d H:i') ?? '',
                    ]),
                );
            } catch (\Throwable $e) {
                Log::warning('Teams calendar notify failed: '.$e->getMessage());
            }
        }
    }

    private function broadcastHr(string $title, string $message): void
    {
        $slack = $this->activeIntegration(IntegrationService::Slack);
        if ($slack) {
            try {
                $this->integrations->notifySlack($slack, "*{$title}*\n{$message}");
            } catch (\Throwable) {
                // logged by integration service
            }
        }

        $teams = $this->activeIntegration(IntegrationService::Teams);
        if ($teams) {
            try {
                $this->integrations->notifyTeams($teams, $title, $message);
            } catch (\Throwable) {
                // logged by integration service
            }
        }
    }

    private function emailAdmins(string $subject, string $body, string $module): void
    {
        $email = $this->activeIntegration(IntegrationService::Email);
        if (! $email) {
            return;
        }

        $admins = User::query()
            ->whereIn('role', [UserRole::Admin, UserRole::Manager])
            ->pluck('email');

        foreach ($admins as $to) {
            try {
                $this->integrations->sendEmail(
                    $email,
                    $to,
                    "[WorkSphere {$module}] {$subject}",
                    $body,
                );
            } catch (\Throwable) {
                // logged by integration service
            }
        }
    }

    private function activeIntegration(IntegrationService $service): ?Integration
    {
        return Integration::query()
            ->where('service_name', $service)
            ->where('status', IntegrationStatus::Active)
            ->first();
    }
}
