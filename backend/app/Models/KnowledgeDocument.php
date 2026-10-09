<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class KnowledgeDocument extends Model
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
        'is_current',
        'uploaded_by',
        'supersedes_id',
    ];

    protected function casts(): array
    {
        return [
            'version' => 'integer',
            'file_size' => 'integer',
            'is_current' => 'boolean',
        ];
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function supersedes(): BelongsTo
    {
        return $this->belongsTo(KnowledgeDocument::class, 'supersedes_id');
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
