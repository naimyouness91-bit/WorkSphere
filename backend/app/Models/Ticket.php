<?php

namespace App\Models;

use App\Enums\TicketCategory;
use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Ticket extends Model
{
    protected $fillable = [
        'title',
        'description',
        'category',
        'support_category_id',
        'status',
        'priority',
        'employee_id',
        'assigned_to',
        'conversation_id',
        'resolved_at',
        'first_response_at',
        'escalated_at',
        'sla_escalated',
    ];

    protected function casts(): array
    {
        return [
            'category' => TicketCategory::class,
            'status' => TicketStatus::class,
            'priority' => TicketPriority::class,
            'resolved_at' => 'datetime',
            'first_response_at' => 'datetime',
            'escalated_at' => 'datetime',
            'sla_escalated' => 'boolean',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'employee_id');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function supportCategory(): BelongsTo
    {
        return $this->belongsTo(SupportCategory::class);
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function sla(): HasOne
    {
        return $this->hasOne(TicketSla::class);
    }

    public function updates(): HasMany
    {
        return $this->hasMany(TicketUpdate::class)->latest();
    }

    public function isOwnedBy(User $user): bool
    {
        return $this->employee_id === $user->id;
    }

    public function syncResolvedTimestamp(): void
    {
        if (in_array($this->status, [TicketStatus::Resolved, TicketStatus::Closed], true)) {
            if ($this->resolved_at === null) {
                $this->resolved_at = now();
            }
        } else {
            $this->resolved_at = null;
        }
    }
}
