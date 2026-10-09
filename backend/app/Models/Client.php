<?php

namespace App\Models;

use App\Enums\ClientStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Client extends Model
{
    protected $table = 'crm_clients';

    protected $fillable = [
        'name',
        'company',
        'email',
        'phone',
        'status',
        'owner_id',
    ];

    protected function casts(): array
    {
        return [
            'status' => ClientStatus::class,
        ];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function interactions(): HasMany
    {
        return $this->hasMany(CrmInteraction::class, 'client_id');
    }

    public function deals(): HasMany
    {
        return $this->hasMany(Deal::class, 'client_id');
    }
}
