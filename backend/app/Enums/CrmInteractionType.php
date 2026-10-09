<?php

namespace App\Enums;

enum CrmInteractionType: string
{
    case Call = 'call';
    case Meeting = 'meeting';
    case Email = 'email';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
