<?php

namespace Database\Seeders;

use App\Enums\ApplicationStatus;
use App\Enums\JobStatus;
use App\Enums\OnboardingTaskStatus;
use App\Models\Candidate;
use App\Models\JobPosting;
use App\Models\OnboardingTask;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class RecruitmentOnboardingSeeder extends Seeder
{
    public function run(): void
    {
        $manager = User::query()->where('role', 'manager')->first()
            ?? User::query()->where('role', 'admin')->first();

        if (! $manager) {
            return;
        }

        $posting = JobPosting::firstOrCreate(
            ['title' => 'Senior HR Coordinator', 'department' => 'Human Resources'],
            [
                'description' => 'Support recruitment operations and employee onboarding.',
                'requirements' => '3+ years HR experience, strong communication skills.',
                'location' => 'Hybrid',
                'status' => JobStatus::Open,
            ],
        );

        Candidate::firstOrCreate(
            ['candidate_email' => 'alex.candidate@example.com', 'job_id' => $posting->id],
            [
                'candidate_name' => 'Alex Morgan',
                'resume_path' => 'applications/sample-resume.pdf',
                'original_resume_filename' => 'alex-morgan-cv.pdf',
                'status' => ApplicationStatus::Shortlisted,
                'user_id' => null,
            ],
        );

        $employee = User::query()->where('role', 'employee')->first();
        if ($employee) {
            OnboardingTask::firstOrCreate(
                ['employee_id' => $employee->id, 'task_title' => 'Complete HR paperwork'],
                [
                    'description' => 'Tax forms and policy acknowledgements.',
                    'due_date' => Carbon::today()->addDays(5),
                    'status' => OnboardingTaskStatus::Pending,
                    'created_by' => $manager->id,
                ],
            );
        }
    }
}
