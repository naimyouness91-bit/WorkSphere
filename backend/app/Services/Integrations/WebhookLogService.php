<?php

namespace App\Services\Integrations;

use App\Enums\IntegrationService;
use App\Models\WebhookLog;
use Carbon\Carbon;
use Illuminate\Http\Request;

class WebhookLogService
{
    public function record(
        IntegrationService|string $serviceName,
        string $eventType,
        ?array $payload = null,
    ): WebhookLog {
        $service = $serviceName instanceof IntegrationService
            ? $serviceName->value
            : $serviceName;

        return WebhookLog::create([
            'service_name' => $service,
            'event_type' => $eventType,
            'payload' => $payload,
            'logged_at' => Carbon::now(),
        ]);
    }

    public function query(Request $request)
    {
        $query = WebhookLog::query()->latest('logged_at');

        if ($request->filled('service_name')) {
            $query->where('service_name', $request->string('service_name'));
        }

        if ($request->filled('event_type')) {
            $query->where('event_type', $request->string('event_type'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('logged_at', '>=', $request->string('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('logged_at', '<=', $request->string('date_to'));
        }

        return $query;
    }

    public function export(Request $request): array
    {
        return $this->query($request)
            ->limit(5000)
            ->get()
            ->map(fn (WebhookLog $log) => [
                'id' => $log->id,
                'service_name' => $log->service_name instanceof IntegrationService
                    ? $log->service_name->value
                    : $log->service_name,
                'event_type' => $log->event_type,
                'payload' => $log->payload,
                'timestamp' => $log->logged_at?->toIso8601String(),
            ])
            ->values()
            ->all();
    }
}
