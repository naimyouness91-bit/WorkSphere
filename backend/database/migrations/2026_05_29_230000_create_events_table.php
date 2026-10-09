<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('type', 20);
            $table->string('status', 20)->default('scheduled');
            $table->dateTime('start_date');
            $table->dateTime('end_date');
            $table->foreignId('employee_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->index(['start_date', 'end_date']);
            $table->index('status');
            $table->index('type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
