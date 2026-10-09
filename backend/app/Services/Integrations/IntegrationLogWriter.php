<?php

namespace App\Services\Integrations;

use App\Models\Integration;
use App\Models\IntegrationLog;
use Carbon\Carbon;

class IntegrationLogWriter
{
    public function log(
        Integration $integration,
        string $action,
        string $message,
        string $status = 'success',
        ?array $metadata = null,
        bool $touchSync = true,
    ): IntegrationLog {
        if ($touchSync && $status === 'success') {
            $integration->update(['last_sync_at' => Carbon::now()]);
        }

        if ($status === 'failed') {
            app(IntegrationFailureHandler::class)->handle($integration, $action, $message);
        }

        return IntegrationLog::create([
            'integration_id' => $integration->id,
            'action' => $action,
            'message' => $message,
            'status' => $status,
            'metadata' => $metadata,
        ]);
    }
}
