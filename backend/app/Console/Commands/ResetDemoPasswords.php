<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
class ResetDemoPasswords extends Command
{
    protected $signature = 'worksphere:reset-demo-passwords';

    protected $description = 'Reset demo user passwords to Password1!';

    public function handle(): int
    {
        $emails = [
            'admin@worksphere.test',
            'manager@worksphere.test',
            'employee@worksphere.test',
        ];

        foreach ($emails as $email) {
            $user = User::where('email', $email)->first();

            if (! $user) {
                $this->warn("User not found: {$email}");

                continue;
            }

            $user->password = 'Password1!';
            $user->save();

            $this->info("Password reset: {$email}");
        }

        $this->info('Done. Use password: Password1!');

        return self::SUCCESS;
    }
}
