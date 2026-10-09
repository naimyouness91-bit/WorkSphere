<?php

namespace App\Enums;

enum AlertStatus: string
{
    case Open = 'open';
    case Resolved = 'resolved';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
