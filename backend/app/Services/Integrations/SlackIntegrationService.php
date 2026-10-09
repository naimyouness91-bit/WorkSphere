<?php

namespace App\Services\Integrations;

use App\Models\Integration;
use Illuminate\Support\Facades\Http;

class SlackIntegrationService
{
    public function __construct(
        private IntegrationLogWriter $logger,
    ) {}

    public function sendNotification(Integration $integration, string $text, ?string $channel = null): bool
    {
        if (! $integration->webhook_url) {
            throw new \InvalidArgumentException('Slack webhook URL is required.');
        }

        $payload = ['text' => $text];
        if ($channel) {
            $payload['channel'] = $channel;
        }

        $response = Http::timeout(15)->post($integration->webhook_url, $payload);

        if (! $response->successful()) {
            $this->logger->log(
                $integration,
                'notification_failed',
                'Slack notification failed: '.$response->body(),
                'failed',
            );

            throw new \RuntimeException('Slack API returned '.$response->status());
        }

        $this->logger->log(
            $integration,
            'notification_sent',
            'Slack notification sent'.($channel ? " to {$channel}" : ''),
        );

        return true;
    }

    public function test(Integration $integration): void
    {
        $this->sendNotification(
            $integration,
            'WorkSphere integration test — Slack connection successful.',
            $integration->settings['channel'] ?? null,
        );

        $this->logger->log($integration, 'test', 'Slack connection test succeeded.');
    }
}
