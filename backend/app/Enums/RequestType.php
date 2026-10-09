<?php

namespace App\Enums;

enum RequestType: string
{
    case Leave = 'leave';
    case Vehicle = 'vehicle';
    case Equipment = 'equipment';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
