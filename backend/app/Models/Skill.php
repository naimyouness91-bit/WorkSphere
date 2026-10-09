<?php

namespace App\Models;

use App\Enums\SkillLevel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Skill extends Model
{
    protected $fillable = [
        'name',
        'description',
        'employee_id',
        'level',
    ];

    protected function casts(): array
    {
        return [
            'level' => SkillLevel::class,
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
}
