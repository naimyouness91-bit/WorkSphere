<?php

namespace App\Enums;

enum GoalStatus: string
{
    case Pending = 'pending';
    case InProgress = 'in_progress';
    case Achieved = 'achieved';
    case Cancelled = 'cancelled';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function defaultProgress(): int
    {
        return match ($this) {
            self::Pending => 0,
            self::InProgress => 50,
            self::Achieved => 100,
            self::Cancelled => 0,
        };
    }
}
