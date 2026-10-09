<?php

namespace App\Enums;

enum InsightCategory: string
{
    case Turnover = 'turnover';
    case Performance = 'performance';
    case Finance = 'finance';
    case Hr = 'hr';
    case Recommendation = 'recommendation';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
