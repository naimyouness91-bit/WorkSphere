<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('insights', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->string('category', 40);
            $table->decimal('confidence_score', 5, 2);
            $table->json('meta')->nullable();
            $table->json('recommendation')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->index(['category', 'is_active']);
            $table->index('created_at');
        });

        Schema::create('analytics_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('report_id')->nullable()->constrained('reports')->nullOnDelete();
            $table->string('action', 40);
            $table->text('description');
            $table->json('meta')->nullable();
            $table->timestamp('occurred_at');
            $table->timestamps();

            $table->index(['occurred_at', 'action']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('analytics_audit_logs');
        Schema::dropIfExists('insights');
    }
};
