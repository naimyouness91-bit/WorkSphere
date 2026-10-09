<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('policies', function (Blueprint $table) {
            $table->id();
            $table->string('code', 80);
            $table->unsignedSmallInteger('version')->default(1);
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('file_path');
            $table->string('original_filename');
            $table->string('mime_type', 100)->default('application/pdf');
            $table->unsignedBigInteger('file_size')->default(0);
            $table->date('effective_date');
            $table->boolean('is_current')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('supersedes_id')->nullable()->constrained('policies')->nullOnDelete();
            $table->timestamps();

            $table->unique(['code', 'version']);
            $table->index(['code', 'is_current']);
        });

        Schema::create('contracts', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->foreignId('employee_id')->constrained('users')->cascadeOnDelete();
            $table->string('contract_file_path');
            $table->string('original_filename');
            $table->string('mime_type', 100)->default('application/pdf');
            $table->string('status', 20)->default('pending');
            $table->date('expires_at')->nullable();
            $table->timestamp('signed_at')->nullable();
            $table->string('signed_contract_path')->nullable();
            $table->foreignId('published_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['employee_id', 'status']);
            $table->index('expires_at');
        });

        Schema::create('signatures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('contract_id')->constrained()->cascadeOnDelete();
            $table->string('signature_file_path');
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamp('signed_at');
            $table->timestamps();

            $table->unique('contract_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('signatures');
        Schema::dropIfExists('contracts');
        Schema::dropIfExists('policies');
    }
};
