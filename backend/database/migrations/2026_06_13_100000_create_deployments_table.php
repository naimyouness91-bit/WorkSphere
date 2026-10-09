<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deployments', function (Blueprint $table) {
            $table->id();
            $table->string('environment', 20);
            $table->string('version', 80);
            $table->string('status', 20);
            $table->string('image_tag', 120)->nullable();
            $table->string('commit_sha', 64)->nullable();
            $table->string('triggered_by', 40)->default('ci');
            $table->foreignId('deployed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('rollback_from_id')->nullable()->constrained('deployments')->nullOnDelete();
            $table->boolean('is_active')->default(false);
            $table->text('notes')->nullable();
            $table->json('meta')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->timestamps();

            $table->index(['environment', 'status']);
            $table->index(['environment', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deployments');
    }
};
