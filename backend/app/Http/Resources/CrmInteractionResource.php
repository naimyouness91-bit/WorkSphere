<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CrmInteractionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'client_id' => $this->client_id,
            'partner_id' => $this->partner_id,
            'type' => $this->type->value,
            'notes' => $this->notes,
            'occurred_at' => $this->occurred_at?->toIso8601String(),
            'source' => $this->source,
            'client' => $this->whenLoaded('client', fn () => [
                'id' => $this->client->id,
                'name' => $this->client->name,
                'company' => $this->client->company,
            ]),
            'partner' => $this->whenLoaded('partner', fn () => [
                'id' => $this->partner->id,
                'name' => $this->partner->name,
                'organization' => $this->partner->organization,
            ]),
            'logger' => $this->whenLoaded('logger', fn () => [
                'id' => $this->logger->id,
                'name' => $this->logger->name,
            ]),
        ];
    }
}
