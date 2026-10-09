<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_id')->constrained('job_postings')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('candidate_name');
            $table->string('candidate_email');
            $table->string('resume_path');
            $table->string('original_resume_filename');
            $table->string('status')->default('pending');
            $table->timestamps();

            $table->index(['job_id', 'status']);
            $table->index('candidate_email');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('applications');
    }
};
