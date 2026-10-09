<?php

namespace App\Console\Commands;

use App\Services\Analytics\AdvancedAnalyticsService;
use Illuminate\Console\Command;

class GenerateAnalyticsInsights extends Command
{
    protected $signature = 'analytics:generate-insights';

    protected $description = 'Generate predictive analytics insights';

    public function handle(AdvancedAnalyticsService $analytics): int
    {
        $count = $analytics->generateInsights(true);
        $this->info("Generated {$count} new insight(s).");

        return self::SUCCESS;
    }
}
