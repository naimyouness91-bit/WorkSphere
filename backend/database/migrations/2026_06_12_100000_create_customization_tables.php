<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('theme_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->string('theme', 20)->default('light');
            $table->string('primary_color', 7)->default('#4f46e5');
            $table->string('secondary_color', 7)->default('#6366f1');
            $table->timestamps();
        });

        Schema::create('workflows', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->json('steps');
            $table->json('assigned_roles');
            $table->string('domain', 30)->default('general');
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['domain', 'is_active']);
        });

        Schema::create('system_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->string('category', 40)->default('general');
            $table->timestamps();

            $table->index('category');
        });

        Schema::create('customization_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 40);
            $table->string('entity_type', 40);
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->json('changes')->nullable();
            $table->timestamp('logged_at');
            $table->timestamps();

            $table->index(['entity_type', 'logged_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customization_audit_logs');
        Schema::dropIfExists('system_settings');
        Schema::dropIfExists('workflows');
        Schema::dropIfExists('theme_settings');
    }
};
