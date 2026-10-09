<?php

namespace App\Models;

use App\Enums\UserRole;
use Illuminate\Database\Eloquent\Model;

class RolePermission extends Model
{
    protected $fillable = [
        'role',
        'permission',
        'module',
    ];

    protected function casts(): array
    {
        return [
            'role' => UserRole::class,
        ];
    }
}
