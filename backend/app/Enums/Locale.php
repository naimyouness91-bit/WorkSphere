<?php

namespace App\Enums;

enum Locale: string
{
    case English = 'en';
    case French = 'fr';
    case Arabic = 'ar';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public static function tryFromString(?string $value): ?self
    {
        if ($value === null || $value === '') {
            return null;
        }

        $normalized = strtolower(substr($value, 0, 2));

        return self::tryFrom($normalized);
    }

    public static function resolve(?string $preferred = null, ?string $acceptLanguage = null): self
    {
        if ($locale = self::tryFromString($preferred)) {
            return $locale;
        }

        if ($acceptLanguage) {
            foreach (explode(',', $acceptLanguage) as $part) {
                $tag = trim(explode(';', $part)[0]);
                if ($locale = self::tryFromString($tag)) {
                    return $locale;
                }
            }
        }

        return self::English;
    }
}
