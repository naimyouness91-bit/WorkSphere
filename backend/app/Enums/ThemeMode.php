<?php

namespace App\Enums;

enum ThemeMode: string
{
    case Light = 'light';
    case Dark = 'dark';
    case Custom = 'custom';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
