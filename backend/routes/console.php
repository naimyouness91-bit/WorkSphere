<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

Schedule::command('helpdesk:escalate-sla')->everyFiveMinutes();
Schedule::command('accounting:check-alerts')->daily();
Schedule::command('security:check-alerts')->hourly();
Schedule::command('integrations:sync-calendars')->daily();
Schedule::command('analytics:generate-insights')->daily();
