<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('support_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('slug', 40)->unique();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::table('tickets', function (Blueprint $table) {
            $table->foreignId('support_category_id')->nullable()->after('category')->constrained('support_categories')->nullOnDelete();
            $table->foreignId('conversation_id')->nullable()->after('assigned_to')->constrained('conversations')->nullOnDelete();
            $table->timestamp('first_response_at')->nullable()->after('resolved_at');
            $table->timestamp('escalated_at')->nullable()->after('first_response_at');
            $table->boolean('sla_escalated')->default(false)->after('escalated_at');
        });

        Schema::create('ticket_slas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->unique()->constrained('tickets')->cascadeOnDelete();
            $table->timestamp('response_due_at');
            $table->timestamp('resolution_due_at');
            $table->timestamp('responded_at')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->string('status', 20)->default('on_track');
            $table->timestamps();

            $table->index('status');
            $table->index('response_due_at');
            $table->index('resolution_due_at');
        });

        Schema::create('ticket_updates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained('tickets')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('type', 30);
            $table->text('message');
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['ticket_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_updates');
        Schema::dropIfExists('ticket_slas');
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropConstrainedForeignId('support_category_id');
            $table->dropConstrainedForeignId('conversation_id');
            $table->dropColumn(['first_response_at', 'escalated_at', 'sla_escalated']);
        });
        Schema::dropIfExists('support_categories');
    }
};
