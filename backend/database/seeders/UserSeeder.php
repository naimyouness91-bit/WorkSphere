<?php

namespace Database\Seeders;

use App\Enums\Locale;
use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'name' => 'Admin User',
                'email' => 'admin@worksphere.test',
                'password' => 'Password1!',
                'role' => UserRole::Admin,
                'locale' => Locale::English,
            ],
            [
                'name' => 'Manager User',
                'email' => 'manager@worksphere.test',
                'password' => 'Password1!',
                'role' => UserRole::Manager,
                'locale' => Locale::French,
            ],
            [
                'name' => 'Employee User',
                'email' => 'employee@worksphere.test',
                'password' => 'Password1!',
                'role' => UserRole::Employee,
                'locale' => Locale::Arabic,
            ],
        ];

        foreach ($users as $data) {
            $user = User::firstOrNew(['email' => $data['email']]);
            $user->name = $data['name'];
            $user->role = $data['role'];
            $user->locale = $data['locale'] ?? Locale::English;
            $user->password = $data['password'];
            $user->save();
        }
    }
}
