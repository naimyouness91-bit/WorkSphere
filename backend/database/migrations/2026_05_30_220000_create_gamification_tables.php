<?php

use Carbon\Carbon;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('badges', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('title');
            $table->text('description');
            $table->string('icon', 50)->default('trophy');
            $table->string('criteria_key', 50);
            $table->unsignedInteger('criteria_value')->default(1);
            $table->unsignedInteger('points_reward')->default(0);
            $table->string('color', 20)->default('indigo');
            $table->timestamps();
        });

        Schema::create('user_points', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->unsignedInteger('total_points')->default(0);
            $table->unsignedSmallInteger('level')->default(1);
            $table->timestamps();
        });

        Schema::create('point_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->integer('points');
            $table->string('reason', 100);
            $table->string('source_type', 50)->nullable();
            $table->unsignedBigInteger('source_id')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
        });

        Schema::create('user_badges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('badge_id')->constrained()->cascadeOnDelete();
            $table->timestamp('earned_at');
            $table->timestamps();

            $table->unique(['user_id', 'badge_id']);
        });

        Schema::create('weekly_challenges', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50);
            $table->string('title');
            $table->text('description');
            $table->string('action_type', 50);
            $table->unsignedInteger('target_count');
            $table->unsignedInteger('points_reward');
            $table->string('department')->nullable();
            $table->date('week_start');
            $table->date('week_end');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['week_start', 'week_end', 'is_active']);
        });

        Schema::create('user_challenge_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('weekly_challenge_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('progress')->default(0);
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'weekly_challenge_id']);
        });

        $now = Carbon::now();
        $weekStart = $now->copy()->startOfWeek();
        $weekEnd = $now->copy()->endOfWeek();

        DB::table('badges')->insert([
            ['code' => 'first_request', 'title' => 'First Step', 'description' => 'Submit your first internal request.', 'icon' => 'paper-plane', 'criteria_key' => 'requests_submitted', 'criteria_value' => 1, 'points_reward' => 20, 'color' => 'sky', 'created_at' => $now, 'updated_at' => $now],
            ['code' => 'request_pro', 'title' => 'Request Pro', 'description' => 'Submit 5 internal requests.', 'icon' => 'clipboard-list', 'criteria_key' => 'requests_submitted', 'criteria_value' => 5, 'points_reward' => 50, 'color' => 'indigo', 'created_at' => $now, 'updated_at' => $now],
            ['code' => 'approver', 'title' => 'Trusted Approver', 'description' => 'Approve 3 requests.', 'icon' => 'check-circle', 'criteria_key' => 'requests_approved', 'criteria_value' => 3, 'points_reward' => 40, 'color' => 'emerald', 'created_at' => $now, 'updated_at' => $now],
            ['code' => 'learner', 'title' => 'Lifelong Learner', 'description' => 'Complete 2 training sessions.', 'icon' => 'graduation-cap', 'criteria_key' => 'trainings_completed', 'criteria_value' => 2, 'points_reward' => 60, 'color' => 'violet', 'created_at' => $now, 'updated_at' => $now],
            ['code' => 'high_performer', 'title' => 'High Performer', 'description' => 'Achieve 2 evaluations with score 4+.', 'icon' => 'star', 'criteria_key' => 'evaluations_high_score', 'criteria_value' => 2, 'points_reward' => 75, 'color' => 'amber', 'created_at' => $now, 'updated_at' => $now],
            ['code' => 'documentarian', 'title' => 'Documentarian', 'description' => 'Upload 3 documents.', 'icon' => 'folder-open', 'criteria_key' => 'documents_uploaded', 'criteria_value' => 3, 'points_reward' => 35, 'color' => 'rose', 'created_at' => $now, 'updated_at' => $now],
            ['code' => 'point_collector', 'title' => 'Point Collector', 'description' => 'Reach 200 total points.', 'icon' => 'coins', 'criteria_key' => 'total_points', 'criteria_value' => 200, 'points_reward' => 25, 'color' => 'fuchsia', 'created_at' => $now, 'updated_at' => $now],
            ['code' => 'project_lead', 'title' => 'Project Lead', 'description' => 'Manage an active project.', 'icon' => 'diagram-project', 'criteria_key' => 'projects_active', 'criteria_value' => 1, 'points_reward' => 45, 'color' => 'cyan', 'created_at' => $now, 'updated_at' => $now],
        ]);

        DB::table('weekly_challenges')->insert([
            [
                'code' => 'weekly_requests',
                'title' => 'Request Sprint',
                'description' => 'Submit 3 internal requests this week.',
                'action_type' => 'request_submit',
                'target_count' => 3,
                'points_reward' => 50,
                'department' => null,
                'week_start' => $weekStart,
                'week_end' => $weekEnd,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'code' => 'weekly_training',
                'title' => 'Learning Week',
                'description' => 'Complete 1 training session this week.',
                'action_type' => 'training_complete',
                'target_count' => 1,
                'points_reward' => 40,
                'department' => null,
                'week_start' => $weekStart,
                'week_end' => $weekEnd,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'code' => 'weekly_documents',
                'title' => 'Knowledge Share',
                'description' => 'Upload 2 documents this week.',
                'action_type' => 'document_upload',
                'target_count' => 2,
                'points_reward' => 35,
                'department' => null,
                'week_start' => $weekStart,
                'week_end' => $weekEnd,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('user_challenge_progress');
        Schema::dropIfExists('weekly_challenges');
        Schema::dropIfExists('user_badges');
        Schema::dropIfExists('point_transactions');
        Schema::dropIfExists('user_points');
        Schema::dropIfExists('badges');
    }
};
