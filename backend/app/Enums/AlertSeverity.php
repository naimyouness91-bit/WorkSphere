<?php

namespace App\Enums;

enum AlertSeverity: string
{
    case Low = 'low';
    case Medium = 'medium';
    case High = 'high';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
