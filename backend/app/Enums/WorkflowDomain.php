<?php

namespace App\Enums;

enum WorkflowDomain: string
{
    case General = 'general';
    case Hr = 'hr';
    case Finance = 'finance';
    case Procurement = 'procurement';
    case It = 'it';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
