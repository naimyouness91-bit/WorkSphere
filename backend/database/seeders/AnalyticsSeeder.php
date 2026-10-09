<?php

namespace Database\Seeders;

use App\Enums\InsightCategory;
use App\Models\Insight;
use Illuminate\Database\Seeder;

class AnalyticsSeeder extends Seeder
{
    public function run(): void
    {
        if (Insight::count() > 0) {
            return;
        }

        Insight::create([
            'title' => 'High turnover risk in Sales',
            'description' => 'Sales shows elevated attrition signals based on low evaluation scores and request rejections.',
            'category' => InsightCategory::Turnover,
            'confidence_score' => 0.84,
            'meta' => ['department' => 'Sales'],
            'recommendation' => [
                'action' => 'Offer targeted training and 1:1 check-ins to reduce turnover risk.',
                'priority' => 'high',
            ],
        ]);
    }
}
