<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PurchaseOrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'po_number' => $this->po_number,
            'supplier_id' => $this->supplier_id,
            'total_amount' => (float) $this->total_amount,
            'status' => $this->status->value,
            'notes' => $this->notes,
            'approved_at' => $this->approved_at?->toIso8601String(),
            'delivered_at' => $this->delivered_at?->toIso8601String(),
            'supplier' => $this->whenLoaded('supplier', fn () => [
                'id' => $this->supplier->id,
                'name' => $this->supplier->name,
                'rating' => (float) $this->supplier->rating,
            ]),
            'creator' => $this->whenLoaded('creator', fn () => [
                'id' => $this->creator->id,
                'name' => $this->creator->name,
            ]),
            'approver' => $this->whenLoaded('approver', fn () => $this->approver ? [
                'id' => $this->approver->id,
                'name' => $this->approver->name,
            ] : null),
            'lines' => $this->whenLoaded('lines', fn () => $this->lines->map(fn ($line) => [
                'id' => $line->id,
                'inventory_item_id' => $line->inventory_item_id,
                'quantity' => $line->quantity,
                'unit_price' => (float) $line->unit_price,
                'line_total' => (float) $line->line_total,
                'item' => $line->relationLoaded('item') && $line->item ? [
                    'id' => $line->item->id,
                    'name' => $line->item->name,
                    'category' => $line->item->category,
                ] : null,
            ])),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
