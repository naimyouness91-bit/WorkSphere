<?php

namespace App\Models;

use App\Enums\CrmInteractionType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CrmInteraction extends Model
{
    protected $table = 'crm_interactions';

    protected $fillable = [
        'client_id',
        'partner_id',
        'type',
        'notes',
        'occurred_at',
        'logged_by',
        'source',
        'external_id',
    ];

    protected function casts(): array
    {
        return [
            'type' => CrmInteractionType::class,
            'occurred_at' => 'datetime',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    public function logger(): BelongsTo
    {
        return $this->belongsTo(User::class, 'logged_by');
    }
}
