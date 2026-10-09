<?php

namespace App\Console\Commands;

use App\Services\HelpdeskService;
use Illuminate\Console\Command;

class EscalateHelpdeskSla extends Command
{
    protected $signature = 'helpdesk:escalate-sla';

    protected $description = 'Auto-escalate helpdesk tickets breaching SLA';

    public function handle(HelpdeskService $helpdesk): int
    {
        $count = $helpdesk->processSlaEscalations();
        $this->info("Escalated {$count} ticket(s).");

        return self::SUCCESS;
    }
}
