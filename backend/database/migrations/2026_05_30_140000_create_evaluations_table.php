<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('evaluations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('evaluator_id')->constrained('users')->cascadeOnDelete();
            $table->string('review_period', 50);
            $table->decimal('score', 4, 2);
            $table->text('comments')->nullable();
            $table->string('status')->default('draft');
            $table->timestamps();

            $table->index(['employee_id', 'review_period']);
            $table->index(['status', 'review_period']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('evaluations');
    }
};
