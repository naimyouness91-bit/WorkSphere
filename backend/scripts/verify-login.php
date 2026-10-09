<?php

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

$email = 'admin@worksphere.test';
$password = 'Password1!';

$user = User::where('email', $email)->first();

if (! $user) {
    echo "NO USER: {$email}\n";
    exit(1);
}

echo "User: {$user->email}\n";
echo "Password check: ".(Hash::check($password, $user->password) ? 'OK' : 'FAIL')."\n";
echo "Auth attempt: ".(auth('api')->attempt(['email' => $email, 'password' => $password]) ? 'OK' : 'FAIL')."\n";
