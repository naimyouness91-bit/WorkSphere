<?php

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case Manager = 'manager';
    case Employee = 'employee';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
