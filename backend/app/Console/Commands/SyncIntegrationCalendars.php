<?php

namespace App\Console\Commands;

use App\Services\Integrations\IntegrationManager;
use Illuminate\Console\Command;

class SyncIntegrationCalendars extends Command
{
    protected $signature = 'integrations:sync-calendars';

    protected $description = 'Sync upcoming calendar events to Google Calendar and Teams';

    public function handle(IntegrationManager $integrations): int
    {
        $count = $integrations->syncCalendars();
        $this->info("Synced {$count} calendar event(s).");

        return self::SUCCESS;
    }
}
