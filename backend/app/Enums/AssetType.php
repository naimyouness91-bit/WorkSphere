<?php

namespace App\Enums;

enum AssetType: string
{
    case Equipment = 'equipment';
    case Vehicle = 'vehicle';
    case License = 'license';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
