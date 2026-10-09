<?php

namespace App\Services\Integrations;

use App\Models\Integration;
use Illuminate\Support\Facades\Http;

class TeamsIntegrationService
{
    public function __construct(
        private IntegrationLogWriter $logger,
    ) {}

    public function sendNotification(Integration $integration, string $title, string $text): bool
    {
        if (! $integration->webhook_url) {
            throw new \InvalidArgumentException('Microsoft Teams webhook URL is required.');
        }

        $payload = [
            '@type' => 'MessageCard',
            '@context' => 'https://schema.org/extensions',
            'summary' => $title,
            'themeColor' => '6366F1',
            'title' => $title,
            'text' => $text,
        ];

        $response = Http::timeout(15)->post($integration->webhook_url, $payload);

        if (! $response->successful()) {
            $this->logger->log(
                $integration,
                'notification_failed',
                'Teams notification failed: '.$response->body(),
                'failed',
            );

            throw new \RuntimeException('Teams webhook returned '.$response->status());
        }

        $this->logger->log($integration, 'notification_sent', 'Teams notification sent: '.$title);

        return true;
    }

    public function test(Integration $integration): void
    {
        $this->sendNotification(
            $integration,
            'WorkSphere test',
            'Microsoft Teams integration is connected successfully.',
        );

        $this->logger->log($integration, 'test', 'Teams connection test succeeded.');
    }
}
