<?php

namespace App\Models;

use App\Enums\TicketUpdateType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TicketUpdate extends Model
{
    protected $fillable = [
        'ticket_id',
        'user_id',
        'type',
        'message',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'type' => TicketUpdateType::class,
            'meta' => 'array',
        ];
    }

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
