<?php

namespace App\Enums;

enum MilestoneStatus: string
{
    case Pending = 'pending';
    case Completed = 'completed';
    case Missed = 'missed';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
