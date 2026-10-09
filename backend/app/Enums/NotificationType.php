<?php

namespace App\Enums;

enum NotificationType: string
{
    case Info = 'info';
    case Success = 'success';
    case Error = 'error';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
