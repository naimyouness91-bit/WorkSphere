<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class KnowledgeArticle extends Model
{
    protected $fillable = [
        'code',
        'version',
        'title',
        'content',
        'category',
        'is_current',
        'author_id',
        'supersedes_id',
        'helpful_count',
        'not_helpful_count',
    ];

    protected function casts(): array
    {
        return [
            'version' => 'integer',
            'is_current' => 'boolean',
            'helpful_count' => 'integer',
            'not_helpful_count' => 'integer',
        ];
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function supersedes(): BelongsTo
    {
        return $this->belongsTo(KnowledgeArticle::class, 'supersedes_id');
    }

    public function ratings(): HasMany
    {
        return $this->hasMany(KnowledgeArticleRating::class, 'article_id');
    }

    public static function versionsForCode(string $code)
    {
        return static::where('code', $code)->orderByDesc('version');
    }
}
