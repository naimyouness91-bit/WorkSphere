<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->string('integrity_hash', 64)->nullable()->after('logged_at');
            $table->string('previous_hash', 64)->nullable()->after('integrity_hash');
        });

        Schema::create('role_permissions', function (Blueprint $table) {
            $table->id();
            $table->string('role', 20);
            $table->string('permission', 80);
            $table->string('module', 60);
            $table->timestamps();

            $table->unique(['role', 'permission', 'module']);
            $table->index(['role', 'module']);
        });

        Schema::create('security_alerts', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->string('severity', 20);
            $table->string('status', 20)->default('open');
            $table->string('source_type', 60)->nullable();
            $table->json('meta')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('notified_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'severity']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('security_alerts');
        Schema::dropIfExists('role_permissions');

        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropColumn(['integrity_hash', 'previous_hash']);
        });
    }
};
