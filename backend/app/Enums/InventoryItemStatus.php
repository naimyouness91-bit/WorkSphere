<?php

namespace App\Enums;

enum InventoryItemStatus: string
{
    case InStock = 'in_stock';
    case OutOfStock = 'out_of_stock';

    public static function fromQuantity(int $quantity): self
    {
        return $quantity > 0 ? self::InStock : self::OutOfStock;
    }
}
