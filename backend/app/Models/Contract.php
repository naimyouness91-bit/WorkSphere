<?php

namespace App\Models;

use App\Enums\ContractStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\Storage;

class Contract extends Model
{
    protected $fillable = [
        'title',
        'description',
        'employee_id',
        'contract_file_path',
        'original_filename',
        'mime_type',
        'status',
        'expires_at',
        'signed_at',
        'signed_contract_path',
        'published_by',
    ];

    protected function casts(): array
    {
        return [
            'status' => ContractStatus::class,
            'expires_at' => 'date',
            'signed_at' => 'datetime',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'employee_id');
    }

    public function publisher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'published_by');
    }

    public function signature(): HasOne
    {
        return $this->hasOne(Signature::class);
    }

    public function isOwnedBy(User $user): bool
    {
        return $this->employee_id === $user->id;
    }

    public function refreshStatus(): void
    {
        if ($this->status === ContractStatus::Signed) {
            return;
        }

        if ($this->expires_at && $this->expires_at->isPast()) {
            $this->update(['status' => ContractStatus::Expired]);
        }
    }

    public function deleteStoredFiles(): void
    {
        foreach ([$this->contract_file_path, $this->signed_contract_path] as $path) {
            if ($path && Storage::disk('local')->exists($path)) {
                Storage::disk('local')->delete($path);
            }
        }
    }
}
