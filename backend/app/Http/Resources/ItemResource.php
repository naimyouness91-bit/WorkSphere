<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'category' => $this->category,
            'quantity' => $this->quantity,
            'unit_price' => (float) $this->unit_price,
            'status' => $this->status->value,
            'sku' => $this->sku,
            'qr_token' => $this->qr_token,
            'reorder_level' => $this->reorder_level,
            'low_stock' => $this->isLowStock(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
