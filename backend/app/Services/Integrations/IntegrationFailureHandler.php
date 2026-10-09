<?php

namespace App\Services\Integrations;

use App\Models\Integration;
use App\Services\NotificationService;

class IntegrationFailureHandler
{
    public function __construct(
        private NotificationService $notifications,
    ) {}

    public function handle(Integration $integration, string $context, string $error): void
    {
        $message = __('messages.integrations.failure_alert', [
            'service' => $integration->service_name->value,
            'context' => $context,
            'error' => mb_substr($error, 0, 200),
        ]);

        $this->notifications->notifySecurityAlertToAdmins($message);
    }

    public function handleDisconnect(Integration $integration): void
    {
        $this->notifications->notifySecurityAlertToAdmins(
            __('messages.integrations.disconnected_alert', [
                'service' => $integration->service_name->value,
            ]),
        );
    }
}
