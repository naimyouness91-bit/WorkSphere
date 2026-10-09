<?php

namespace Database\Seeders;

use App\Enums\GoalStatus;
use App\Models\Feedback360;
use App\Models\PerformanceGoal;
use App\Models\PerformanceReview;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class PerformanceManagementSeeder extends Seeder
{
    public function run(): void
    {
        $manager = User::query()->where('role', 'manager')->first()
            ?? User::query()->where('role', 'admin')->first();
        $employee = User::query()->where('role', 'employee')->first();

        if (! $manager || ! $employee) {
            return;
        }

        PerformanceGoal::create([
            'employee_id' => $employee->id,
            'title' => 'Complete Q2 client onboarding playbook',
            'description' => 'Document and train team on updated onboarding steps.',
            'target_date' => Carbon::now()->addMonths(2),
            'status' => GoalStatus::InProgress,
            'progress' => 45,
            'created_by' => $manager->id,
        ]);

        PerformanceGoal::create([
            'employee_id' => $employee->id,
            'title' => 'Achieve 95% attendance rate',
            'description' => 'Maintain consistent attendance through the quarter.',
            'target_date' => Carbon::now()->addMonth(),
            'status' => GoalStatus::Achieved,
            'progress' => 100,
            'created_by' => $manager->id,
        ]);

        PerformanceReview::create([
            'employee_id' => $employee->id,
            'reviewer_id' => $manager->id,
            'comments' => 'Strong collaboration and delivery. Continue developing presentation skills.',
            'rating' => 4.2,
            'review_date' => Carbon::now()->subWeek(),
        ]);

        if ($manager->id !== $employee->id) {
            Feedback360::create([
                'employee_id' => $employee->id,
                'from_user_id' => $manager->id,
                'feedback_text' => 'Reliable teammate who supports others proactively.',
                'rating' => 4.5,
                'feedback_date' => Carbon::today(),
                'is_anonymous' => false,
            ]);
        }
    }
}
