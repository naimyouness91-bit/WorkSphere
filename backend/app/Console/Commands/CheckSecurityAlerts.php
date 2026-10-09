<?php

namespace App\Console\Commands;

use App\Services\SecurityService;
use Illuminate\Console\Command;

class CheckSecurityAlerts extends Command
{
    protected $signature = 'security:check-alerts';

    protected $description = 'Detect suspicious activity and create security alerts';

    public function handle(SecurityService $security): int
    {
        $count = $security->processSuspiciousActivity();
        $this->info("Created {$count} new security alert(s).");

        return self::SUCCESS;
    }
}
