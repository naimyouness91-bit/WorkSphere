<?php

namespace App\Models;

use App\Enums\IntegrationService;
use App\Enums\IntegrationStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Integration extends Model
{
    protected $fillable = [
        'service_name',
        'api_key',
        'webhook_url',
        'status',
        'settings',
        'last_sync_at',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'service_name' => IntegrationService::class,
            'status' => IntegrationStatus::class,
            'api_key' => 'encrypted',
            'settings' => 'array',
            'last_sync_at' => 'datetime',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function logs(): HasMany
    {
        return $this->hasMany(IntegrationLog::class);
    }

    public function isActive(): bool
    {
        return $this->status === IntegrationStatus::Active;
    }

    public function hasCredentials(): bool
    {
        return match ($this->service_name) {
            IntegrationService::Slack, IntegrationService::Teams => filled($this->webhook_url),
            IntegrationService::Email => filled($this->settings['smtp_host'] ?? null)
                || filled($this->api_key),
            IntegrationService::GoogleDrive, IntegrationService::Dropbox => filled($this->api_key),
            IntegrationService::GoogleCalendar => filled($this->api_key),
        };
    }
}
