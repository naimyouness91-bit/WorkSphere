<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificationPreference extends Model
{
    protected $fillable = [
        'user_id',
        'email_enabled',
        'push_enabled',
        'in_app_enabled',
        'category_push',
        'category_email',
    ];

    protected function casts(): array
    {
        return [
            'email_enabled' => 'boolean',
            'push_enabled' => 'boolean',
            'in_app_enabled' => 'boolean',
            'category_push' => 'array',
            'category_email' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public static function defaultsForUser(int $userId): self
    {
        return self::firstOrCreate(
            ['user_id' => $userId],
            [
                'email_enabled' => true,
                'push_enabled' => true,
                'in_app_enabled' => true,
                'category_push' => null,
                'category_email' => null,
            ],
        );
    }

    public function allowsPush(string $category): bool
    {
        if (! $this->push_enabled) {
            return false;
        }

        $allowed = $this->category_push;
        if ($allowed === null || $allowed === []) {
            return true;
        }

        return in_array($category, $allowed, true);
    }

    public function allowsInApp(string $category): bool
    {
        if (! $this->in_app_enabled) {
            return false;
        }

        return true;
    }
}
