<?php

namespace App\Enums;

enum DealStage: string
{
    case Prospect = 'prospect';
    case Negotiation = 'negotiation';
    case Closed = 'closed';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public static function pipeline(): array
    {
        return [
            self::Prospect->value,
            self::Negotiation->value,
            self::Closed->value,
        ];
    }
}
