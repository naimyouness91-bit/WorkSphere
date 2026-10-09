<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('budgets', function (Blueprint $table) {
            $table->string('status', 20)->default('active')->after('spent_amount');
            $table->timestamp('exceeded_notified_at')->nullable()->after('status');
        });

        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number', 40)->unique();
            $table->foreignId('client_id')->constrained('crm_clients')->cascadeOnDelete();
            $table->decimal('amount', 14, 2);
            $table->date('due_date');
            $table->string('status', 20)->default('pending');
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('overdue_notified_at')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['status', 'due_date']);
        });

        Schema::create('financial_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('type', 20);
            $table->decimal('amount', 14, 2);
            $table->date('transaction_date');
            $table->string('reference', 120);
            $table->string('reference_type', 40)->nullable();
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->text('description')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['type', 'transaction_date']);
            $table->index(['reference_type', 'reference_id']);
        });

        Schema::create('finance_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 60);
            $table->string('entity_type', 40);
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->text('description');
            $table->json('meta')->nullable();
            $table->timestamp('occurred_at');
            $table->timestamps();

            $table->index(['entity_type', 'entity_id']);
        });

        Schema::create('finance_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('event_type', 60);
            $table->string('entity_type', 40);
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->text('summary');
            $table->json('payload')->nullable();
            $table->timestamp('occurred_at');
            $table->timestamps();

            $table->index('occurred_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('finance_history');
        Schema::dropIfExists('finance_audit_logs');
        Schema::dropIfExists('financial_transactions');
        Schema::dropIfExists('invoices');
        Schema::table('budgets', function (Blueprint $table) {
            $table->dropColumn(['status', 'exceeded_notified_at']);
        });
    }
};
