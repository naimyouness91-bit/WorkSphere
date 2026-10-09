<?php

namespace App\Services\Integrations;

use App\Models\Integration;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Mail;

class EmailIntegrationService
{
    public function __construct(
        private IntegrationLogWriter $logger,
    ) {}

    public function send(Integration $integration, string $to, string $subject, string $body): bool
    {
        $this->applyMailConfig($integration);

        Mail::raw($body, function ($message) use ($to, $subject, $integration) {
            $message->to($to)->subject($subject);
            $from = $integration->settings['from_address'] ?? config('mail.from.address');
            $name = $integration->settings['from_name'] ?? config('mail.from.name');
            if ($from) {
                $message->from($from, $name);
            }
        });

        $this->logger->log(
            $integration,
            'email_sent',
            "Email sent to {$to}: {$subject}",
        );

        return true;
    }

    public function sendApprovalAlert(Integration $integration, string $to, string $title, string $details): bool
    {
        return $this->send(
            $integration,
            $to,
            "[WorkSphere] {$title}",
            "WorkSphere notification\n\n{$title}\n\n{$details}",
        );
    }

    public function test(Integration $integration, string $testRecipient): void
    {
        $this->send(
            $integration,
            $testRecipient,
            'WorkSphere — Email integration test',
            'Your WorkSphere email (SMTP) integration is configured correctly.',
        );

        $this->logger->log($integration, 'test', 'Email connection test succeeded.');
    }

    private function applyMailConfig(Integration $integration): void
    {
        $settings = $integration->settings ?? [];

        if (! empty($settings['smtp_host'])) {
            Config::set('mail.default', 'smtp');
            Config::set('mail.mailers.smtp.host', $settings['smtp_host']);
            Config::set('mail.mailers.smtp.port', $settings['smtp_port'] ?? 587);
            Config::set('mail.mailers.smtp.username', $settings['smtp_username'] ?? null);
            Config::set('mail.mailers.smtp.password', $settings['smtp_password'] ?? $integration->api_key);
            Config::set('mail.mailers.smtp.encryption', $settings['smtp_encryption'] ?? 'tls');
        }
    }
}
