<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('crm_clients', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('company');
            $table->string('email')->nullable();
            $table->string('phone', 40)->nullable();
            $table->string('status', 20)->default('active');
            $table->foreignId('owner_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['status', 'company']);
        });

        Schema::create('crm_partners', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('organization');
            $table->text('contact_info')->nullable();
            $table->string('status', 20)->default('active');
            $table->foreignId('owner_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('status');
        });

        Schema::create('crm_interactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->nullable()->constrained('crm_clients')->cascadeOnDelete();
            $table->foreignId('partner_id')->nullable()->constrained('crm_partners')->cascadeOnDelete();
            $table->string('type', 20);
            $table->text('notes')->nullable();
            $table->dateTime('occurred_at');
            $table->foreignId('logged_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('source', 30)->default('manual');
            $table->string('external_id')->nullable();
            $table->timestamps();

            $table->index(['client_id', 'occurred_at']);
            $table->index(['partner_id', 'occurred_at']);
            $table->index('external_id');
        });

        Schema::create('crm_deals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('crm_clients')->cascadeOnDelete();
            $table->string('title');
            $table->decimal('value', 14, 2)->default(0);
            $table->string('stage', 20)->default('prospect');
            $table->string('status', 20)->default('open');
            $table->foreignId('owner_id')->nullable()->constrained('users')->nullOnDelete();
            $table->date('expected_close_date')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();

            $table->index(['client_id', 'stage']);
            $table->index('status');
        });

        Schema::create('crm_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 50);
            $table->string('entity_type', 40);
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->text('description');
            $table->json('meta')->nullable();
            $table->timestamp('occurred_at');
            $table->timestamps();

            $table->index(['entity_type', 'entity_id']);
            $table->index('occurred_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('crm_audit_logs');
        Schema::dropIfExists('crm_deals');
        Schema::dropIfExists('crm_interactions');
        Schema::dropIfExists('crm_partners');
        Schema::dropIfExists('crm_clients');
    }
};
