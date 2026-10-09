<?php

namespace App\Console\Commands;

use App\Models\Report;
use App\Services\ReportingAnalyticsService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class GenerateScheduledReports extends Command
{
    protected $signature = 'reports:generate-scheduled';

    protected $description = 'Generate scheduled reports that are due';

    public function handle(ReportingAnalyticsService $reporting): int
    {
        $due = Report::query()
            ->where('is_scheduled', true)
            ->whereNotNull('next_run_at')
            ->where('next_run_at', '<=', Carbon::now())
            ->get();

        foreach ($due as $template) {
            $filters = $reporting->resolveFilters([
                'module' => $template->type->value,
                'department' => $template->department,
                'date_from' => $template->date_from?->format('Y-m-d'),
                'date_to' => $template->date_to?->format('Y-m-d'),
            ]);

            $payload = $reporting->buildPayloadForType($template->type->value, $filters);

            Report::create([
                'title' => $template->title.' — '.Carbon::now()->format('Y-m-d'),
                'description' => $template->description,
                'type' => $template->type,
                'generated_by' => $template->generated_by,
                'generated_at' => Carbon::now(),
                'date_from' => $filters['date_from'],
                'date_to' => $filters['date_to'],
                'department' => $filters['department'] ?? null,
                'payload' => $payload,
                'is_scheduled' => false,
            ]);

            $frequency = $template->schedule_frequency?->value ?? 'monthly';
            $template->update([
                'next_run_at' => $reporting->computeNextRunAt($frequency),
            ]);

            $this->info("Generated report from template #{$template->id}");
        }

        return self::SUCCESS;
    }
}
