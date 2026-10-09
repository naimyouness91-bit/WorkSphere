<?php

namespace App\Enums;

enum OnboardingTaskStatus: string
{
    case Pending = 'pending';
    case Completed = 'completed';
    case Overdue = 'overdue';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
