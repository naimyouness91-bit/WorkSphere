<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assistant_interactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('interaction_type', 20); // suggest, chat
            $table->text('user_message')->nullable();
            $table->text('assistant_response');
            $table->json('suggestions')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
            $table->index(['user_id', 'interaction_type', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assistant_interactions');
    }
};
