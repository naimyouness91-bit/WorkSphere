<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 40);
            $table->string('module', 60);
            $table->text('description');
            $table->string('ip_address', 45)->nullable();
            $table->timestamp('logged_at');
            $table->timestamps();

            $table->index(['logged_at', 'action']);
            $table->index(['module', 'logged_at']);
            $table->index(['user_id', 'logged_at']);
            $table->index('ip_address');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
