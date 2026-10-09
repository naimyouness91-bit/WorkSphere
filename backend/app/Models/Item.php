<?php

namespace App\Models;

use App\Enums\InventoryItemStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Item extends Model
{
    protected $table = 'inventory_items';

    protected $fillable = [
        'name',
        'category',
        'quantity',
        'unit_price',
        'status',
        'sku',
        'qr_token',
        'reorder_level',
        'low_stock_notified_at',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'unit_price' => 'decimal:2',
            'status' => InventoryItemStatus::class,
            'reorder_level' => 'integer',
            'low_stock_notified_at' => 'datetime',
        ];
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class, 'inventory_item_id');
    }

    public function purchaseOrderLines(): HasMany
    {
        return $this->hasMany(PurchaseOrderLine::class, 'inventory_item_id');
    }

    public function isLowStock(): bool
    {
        return $this->quantity <= $this->reorder_level;
    }

    public function syncStatusFromQuantity(): void
    {
        $this->status = InventoryItemStatus::fromQuantity($this->quantity);
    }
}
