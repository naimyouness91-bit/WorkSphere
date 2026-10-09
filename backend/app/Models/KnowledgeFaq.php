<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KnowledgeFaq extends Model
{
    protected $fillable = [
        'question',
        'answer',
        'category',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
        ];
    }
}
