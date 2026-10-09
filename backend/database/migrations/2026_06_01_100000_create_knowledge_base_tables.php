<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('knowledge_articles', function (Blueprint $table) {
            $table->id();
            $table->string('code', 80);
            $table->unsignedSmallInteger('version')->default(1);
            $table->string('title');
            $table->longText('content');
            $table->string('category', 80)->default('general');
            $table->boolean('is_current')->default(true);
            $table->foreignId('author_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('supersedes_id')->nullable()->constrained('knowledge_articles')->nullOnDelete();
            $table->unsignedInteger('helpful_count')->default(0);
            $table->unsignedInteger('not_helpful_count')->default(0);
            $table->timestamps();

            $table->unique(['code', 'version']);
            $table->index(['code', 'is_current']);
            $table->index('category');
        });

        Schema::create('knowledge_article_ratings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('article_id')->constrained('knowledge_articles')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->boolean('helpful');
            $table->timestamps();

            $table->unique(['article_id', 'user_id']);
        });

        Schema::create('knowledge_article_views', function (Blueprint $table) {
            $table->id();
            $table->foreignId('article_id')->constrained('knowledge_articles')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('viewed_at');
            $table->timestamps();

            $table->index(['user_id', 'viewed_at']);
        });

        Schema::create('knowledge_faqs', function (Blueprint $table) {
            $table->id();
            $table->string('question');
            $table->text('answer');
            $table->string('category', 80)->default('general');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index('category');
        });

        Schema::create('knowledge_documents', function (Blueprint $table) {
            $table->id();
            $table->string('code', 80);
            $table->unsignedSmallInteger('version')->default(1);
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('file_path');
            $table->string('original_filename');
            $table->string('mime_type', 100)->default('application/pdf');
            $table->unsignedBigInteger('file_size')->default(0);
            $table->boolean('is_current')->default(true);
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('supersedes_id')->nullable()->constrained('knowledge_documents')->nullOnDelete();
            $table->timestamps();

            $table->unique(['code', 'version']);
            $table->index(['code', 'is_current']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('knowledge_documents');
        Schema::dropIfExists('knowledge_faqs');
        Schema::dropIfExists('knowledge_article_views');
        Schema::dropIfExists('knowledge_article_ratings');
        Schema::dropIfExists('knowledge_articles');
    }
};
