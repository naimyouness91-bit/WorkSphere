<?php

namespace App\Models;

use App\Enums\IntegrationService;
use Illuminate\Database\Eloquent\Model;

class WebhookLog extends Model
{
    protected $fillable = [
        'service_name',
        'event_type',
        'payload',
        'logged_at',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'logged_at' => 'datetime',
        ];
    }
}
