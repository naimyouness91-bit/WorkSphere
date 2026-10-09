<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('webhook_logs', function (Blueprint $table) {
            $table->id();
            $table->string('service_name', 40);
            $table->string('event_type', 80);
            $table->json('payload')->nullable();
            $table->timestamp('logged_at');
            $table->timestamps();

            $table->index(['service_name', 'logged_at']);
            $table->index(['event_type', 'logged_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('webhook_logs');
    }
};
