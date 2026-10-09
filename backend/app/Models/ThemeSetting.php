<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ThemeSetting extends Model
{
    protected $fillable = [
        'user_id',
        'theme',
        'primary_color',
        'secondary_color',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
