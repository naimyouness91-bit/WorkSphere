<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('skills', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->foreignId('employee_id')->constrained('users')->cascadeOnDelete();
            $table->string('level')->default('beginner');
            $table->timestamps();

            $table->index(['employee_id', 'level']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('skills');
    }
};
