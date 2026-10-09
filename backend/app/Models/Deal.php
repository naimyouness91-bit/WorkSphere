<?php

namespace App\Models;

use App\Enums\DealStage;
use App\Enums\DealStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Deal extends Model
{
    protected $table = 'crm_deals';

    protected $fillable = [
        'client_id',
        'title',
        'value',
        'stage',
        'status',
        'owner_id',
        'expected_close_date',
        'closed_at',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'decimal:2',
            'stage' => DealStage::class,
            'status' => DealStatus::class,
            'expected_close_date' => 'date',
            'closed_at' => 'datetime',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }
}
