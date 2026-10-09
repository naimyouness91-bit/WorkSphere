<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class Document extends Model
{
    protected $fillable = [
        'title',
        'description',
        'file_path',
        'original_filename',
        'mime_type',
        'file_size',
        'employee_id',
        'uploaded_at',
    ];

    protected function casts(): array
    {
        return [
            'uploaded_at' => 'datetime',
            'file_size' => 'integer',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'employee_id');
    }

    public function isOwnedBy(User $user): bool
    {
        return $this->employee_id === $user->id;
    }

    public function deleteStoredFile(): void
    {
        if ($this->file_path && Storage::disk('public')->exists($this->file_path)) {
            Storage::disk('public')->delete($this->file_path);
        }
    }

    public function isPreviewable(): bool
    {
        if (str_starts_with($this->mime_type, 'image/')) {
            return true;
        }

        return $this->mime_type === 'application/pdf';
    }
}
