<?php

namespace App\Enums;

enum ContractStatus: string
{
    case Pending = 'pending';
    case Signed = 'signed';
    case Expired = 'expired';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
