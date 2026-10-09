<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('type', 30);
            $table->foreignId('generated_by')->constrained('users')->cascadeOnDelete();
            $table->timestamp('generated_at');
            $table->date('date_from')->nullable();
            $table->date('date_to')->nullable();
            $table->string('department')->nullable();
            $table->json('payload')->nullable();
            $table->boolean('is_scheduled')->default(false);
            $table->string('schedule_frequency', 20)->nullable();
            $table->timestamp('next_run_at')->nullable();
            $table->timestamps();

            $table->index(['type', 'generated_at']);
            $table->index(['is_scheduled', 'next_run_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
