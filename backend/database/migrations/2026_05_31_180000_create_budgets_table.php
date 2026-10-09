<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('budgets', function (Blueprint $table) {
            $table->id();
            $table->string('department');
            $table->decimal('allocated_amount', 14, 2);
            $table->decimal('spent_amount', 14, 2)->default(0);
            $table->string('period', 20);
            $table->unsignedSmallInteger('period_year');
            $table->unsignedTinyInteger('period_month')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['department', 'period', 'period_year', 'period_month'], 'budgets_period_unique');
            $table->index(['department', 'period_year']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('budgets');
    }
};
