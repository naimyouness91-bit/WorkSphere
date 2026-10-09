<?php

namespace App\Enums;

enum ApplicationStatus: string
{
    case Applied = 'applied';
    case Shortlisted = 'shortlisted';
    case Interviewed = 'interviewed';
    case Hired = 'hired';
    case Rejected = 'rejected';

    public static function values(): array
    {
        return [
            self::Applied->value,
            self::Shortlisted->value,
            self::Interviewed->value,
            self::Hired->value,
            self::Rejected->value,
        ];
    }

    public static function pipeline(): array
    {
        return [
            self::Applied->value,
            self::Shortlisted->value,
            self::Interviewed->value,
            self::Hired->value,
        ];
    }
}
