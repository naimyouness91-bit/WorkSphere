<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class Policy extends Model
{
    protected $fillable = [
        'code',
        'version',
        'title',
        'description',
        'file_path',
        'original_filename',
        'mime_type',
        'file_size',
        'effective_date',
        'is_current',
        'created_by',
        'supersedes_id',
    ];

    protected function casts(): array
    {
        return [
            'version' => 'integer',
            'file_size' => 'integer',
            'effective_date' => 'date',
            'is_current' => 'boolean',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function supersedes(): BelongsTo
    {
        return $this->belongsTo(Policy::class, 'supersedes_id');
    }

    public static function versionsForCode(string $code)
    {
        return static::where('code', $code)->orderByDesc('version');
    }

    public function deleteStoredFile(): void
    {
        if ($this->file_path && Storage::disk('local')->exists($this->file_path)) {
            Storage::disk('local')->delete($this->file_path);
        }
    }
}
