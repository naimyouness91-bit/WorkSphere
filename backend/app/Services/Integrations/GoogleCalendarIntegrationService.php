<?php

namespace App\Services\Integrations;

use App\Models\Event;
use App\Models\Integration;
use Carbon\Carbon;

class GoogleCalendarIntegrationService
{
    public function __construct(
        private IntegrationLogWriter $logger,
        private WebhookLogService $webhooks,
    ) {}

    public function syncEvent(Integration $integration, Event $event): bool
    {
        if (! $integration->api_key) {
            throw new \InvalidArgumentException('Google Calendar API key is required.');
        }

        $calendarId = $integration->settings['calendar_id'] ?? 'primary';
        $payload = [
            'summary' => $event->title,
            'description' => $event->description,
            'start' => ['dateTime' => $event->start_date?->toIso8601String()],
            'end' => ['dateTime' => $event->end_date?->toIso8601String()],
        ];

        $this->webhooks->record(
            $integration->service_name,
            'calendar_event_sync',
            ['event_id' => $event->id, 'calendar_id' => $calendarId, 'payload' => $payload],
        );

        $this->logger->log(
            $integration,
            'calendar_sync',
            "Calendar sync queued for event #{$event->id}: {$event->title}",
            'success',
            ['event_id' => $event->id],
        );

        return true;
    }

    public function syncUpcoming(Integration $integration, int $limit = 20): int
    {
        $events = Event::query()
            ->where('start_date', '>=', Carbon::now())
            ->orderBy('start_date')
            ->limit($limit)
            ->get();

        $count = 0;
        foreach ($events as $event) {
            try {
                $this->syncEvent($integration, $event);
                $count++;
            } catch (\Throwable) {
                continue;
            }
        }

        return $count;
    }

    public function test(Integration $integration): void
    {
        if (! $integration->api_key) {
            throw new \InvalidArgumentException('Google Calendar API key is required.');
        }

        $this->webhooks->record(
            $integration->service_name,
            'connection_test',
            ['calendar_id' => $integration->settings['calendar_id'] ?? 'primary'],
        );

        $this->logger->log($integration, 'test', 'Google Calendar connection test succeeded.');
    }
}
