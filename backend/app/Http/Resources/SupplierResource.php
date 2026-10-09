<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SupplierResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'contact_info' => $this->contact_info,
            'rating' => (float) $this->rating,
            'status' => $this->status->value,
            'purchase_orders_count' => $this->whenCounted('purchase_orders'),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
