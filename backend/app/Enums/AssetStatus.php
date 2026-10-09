<?php

namespace App\Enums;

enum AssetStatus: string
{
    case Active = 'active';
    case Inactive = 'inactive';
    case Maintenance = 'maintenance';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
