<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('integrations', function (Blueprint $table) {
            $table->id();
            $table->string('service_name', 30);
            $table->text('api_key')->nullable();
            $table->string('webhook_url', 2048)->nullable();
            $table->string('status', 20)->default('inactive');
            $table->json('settings')->nullable();
            $table->timestamp('last_sync_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique('service_name');
        });

        Schema::create('integration_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('integration_id')->constrained('integrations')->cascadeOnDelete();
            $table->string('action', 40);
            $table->text('message');
            $table->string('status', 20)->default('success');
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['integration_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('integration_logs');
        Schema::dropIfExists('integrations');
    }
};
