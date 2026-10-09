<?php

namespace App\Models;

use App\Enums\SlaStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TicketSla extends Model
{
    protected $table = 'ticket_slas';

    protected $fillable = [
        'ticket_id',
        'response_due_at',
        'resolution_due_at',
        'responded_at',
        'resolved_at',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'response_due_at' => 'datetime',
            'resolution_due_at' => 'datetime',
            'responded_at' => 'datetime',
            'resolved_at' => 'datetime',
            'status' => SlaStatus::class,
        ];
    }

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }
}
