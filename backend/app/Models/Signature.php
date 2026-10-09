<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class Signature extends Model
{
    protected $fillable = [
        'user_id',
        'contract_id',
        'signature_file_path',
        'ip_address',
        'user_agent',
        'signed_at',
    ];

    protected function casts(): array
    {
        return [
            'signed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class);
    }

    public function deleteStoredFile(): void
    {
        if ($this->signature_file_path && Storage::disk('local')->exists($this->signature_file_path)) {
            Storage::disk('local')->delete($this->signature_file_path);
        }
    }
}
