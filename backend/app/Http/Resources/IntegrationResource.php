<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class IntegrationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'service_name' => $this->service_name->value,
            'webhook_url' => $this->webhook_url,
            'status' => $this->status->value,
            'settings' => $this->settings ?? [],
            'has_api_key' => filled($this->api_key),
            'api_key_masked' => filled($this->api_key) ? '••••••••' : null,
            'is_connected' => $this->isActive() && $this->hasCredentials(),
            'last_sync_at' => $this->last_sync_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
