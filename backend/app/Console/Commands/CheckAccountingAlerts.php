<?php

namespace App\Console\Commands;

use App\Services\AccountingService;
use Illuminate\Console\Command;

class CheckAccountingAlerts extends Command
{
    protected $signature = 'accounting:check-alerts';

    protected $description = 'Mark overdue invoices and send finance alerts';

    public function handle(AccountingService $accounting): int
    {
        $count = $accounting->processOverdueInvoices();
        $this->info("Processed {$count} overdue invoice alert(s).");

        return self::SUCCESS;
    }
}
