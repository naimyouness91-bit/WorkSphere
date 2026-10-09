<?php

namespace App\Enums;

enum PurchaseOrderStatus: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Delivered = 'delivered';

    /** @return array<int, string> */
    public static function pipeline(): array
    {
        return [
            self::Pending->value,
            self::Approved->value,
            self::Delivered->value,
        ];
    }
}
