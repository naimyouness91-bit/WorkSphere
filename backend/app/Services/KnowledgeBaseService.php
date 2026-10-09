<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Models\AssistantInteraction;
use App\Models\KnowledgeArticle;
use App\Models\KnowledgeArticleRating;
use App\Models\KnowledgeArticleView;
use App\Models\KnowledgeDocument;
use App\Models\KnowledgeFaq;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class KnowledgeBaseService
{
    public function __construct(
        private NotificationService $notifications,
    ) {}

    public function createArticle(User $author, array $data): KnowledgeArticle
    {
        $code = $data['code'] ?? Str::slug($data['title']);
        $code = Str::limit($code, 80, '');

        $previous = KnowledgeArticle::where('code', $code)->where('is_current', true)->first();
        $version = $previous ? $previous->version + 1 : 1;

        if ($previous) {
            $previous->update(['is_current' => false]);
        }

        $article = KnowledgeArticle::create([
            'code' => $code,
            'version' => $version,
            'title' => $data['title'],
            'content' => $data['content'],
            'category' => $data['category'] ?? 'general',
            'is_current' => true,
            'author_id' => $author->id,
            'supersedes_id' => $previous?->id,
        ]);

        $article->load('author:id,name');
        $this->notifications->notifyKnowledgeArticlePublished($article);

        return $article;
    }

    public function uploadDocument(User $uploader, array $data, UploadedFile $file): KnowledgeDocument
    {
        $code = $data['code'] ?? Str::slug($data['title']);
        $code = Str::limit($code, 80, '');

        $previous = KnowledgeDocument::where('code', $code)->where('is_current', true)->first();
        $version = $previous ? $previous->version + 1 : 1;

        if ($previous) {
            $previous->update(['is_current' => false]);
        }

        $path = $file->store('knowledge/documents/'.$code.'/v'.$version, 'local');

        $document = KnowledgeDocument::create([
            'code' => $code,
            'version' => $version,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'file_path' => $path,
            'original_filename' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType() ?? 'application/octet-stream',
            'file_size' => $file->getSize(),
            'is_current' => true,
            'uploaded_by' => $uploader->id,
            'supersedes_id' => $previous?->id,
        ]);

        $document->load('uploader:id,name');
        $this->notifications->notifyKnowledgeDocumentPublished($document);

        return $document;
    }

    public function recordArticleView(User $user, KnowledgeArticle $article): void
    {
        KnowledgeArticleView::create([
            'article_id' => $article->id,
            'user_id' => $user->id,
            'viewed_at' => now(),
        ]);
    }

    public function rateArticle(User $user, KnowledgeArticle $article, bool $helpful): array
    {
        $existing = KnowledgeArticleRating::where('article_id', $article->id)
            ->where('user_id', $user->id)
            ->first();

        if ($existing) {
            if ($existing->helpful === $helpful) {
                return $this->ratingCounts($article->fresh());
            }

            if ($existing->helpful) {
                $article->decrement('helpful_count');
                $article->increment('not_helpful_count');
            } else {
                $article->decrement('not_helpful_count');
                $article->increment('helpful_count');
            }

            $existing->update(['helpful' => $helpful]);
        } else {
            KnowledgeArticleRating::create([
                'article_id' => $article->id,
                'user_id' => $user->id,
                'helpful' => $helpful,
            ]);

            if ($helpful) {
                $article->increment('helpful_count');
            } else {
                $article->increment('not_helpful_count');
            }
        }

        return $this->ratingCounts($article->fresh());
    }

    /**
     * @return array{helpful_count: int, not_helpful_count: int, user_rating: bool|null}
     */
    private function ratingCounts(KnowledgeArticle $article): array
    {
        return [
            'helpful_count' => $article->helpful_count,
            'not_helpful_count' => $article->not_helpful_count,
        ];
    }

    public function userRatingForArticle(User $user, KnowledgeArticle $article): ?bool
    {
        $rating = KnowledgeArticleRating::where('article_id', $article->id)
            ->where('user_id', $user->id)
            ->first();

        return $rating?->helpful;
    }

    /**
     * @return Collection<int, KnowledgeArticle>
     */
    public function suggestedArticles(User $user, int $limit = 5): Collection
    {
        $viewedCategories = KnowledgeArticleView::query()
            ->where('user_id', $user->id)
            ->where('viewed_at', '>=', Carbon::now()->subDays(30))
            ->join('knowledge_articles', 'knowledge_articles.id', '=', 'knowledge_article_views.article_id')
            ->pluck('knowledge_articles.category')
            ->unique()
            ->filter()
            ->values();

        $query = KnowledgeArticle::query()
            ->with('author:id,name')
            ->where('is_current', true);

        if ($viewedCategories->isNotEmpty()) {
            $query->whereIn('category', $viewedCategories->all())
                ->orderByDesc('helpful_count');
        } else {
            $recentCategories = $this->inferCategoriesFromActivity($user);
            if ($recentCategories->isNotEmpty()) {
                $query->whereIn('category', $recentCategories->all());
            }
            $query->orderByDesc('helpful_count');
        }

        $suggested = $query->limit($limit)->get();

        if ($suggested->count() < $limit) {
            $excludeIds = $suggested->pluck('id')->all();
            $fill = KnowledgeArticle::query()
                ->with('author:id,name')
                ->where('is_current', true)
                ->when($excludeIds !== [], fn ($q) => $q->whereNotIn('id', $excludeIds))
                ->orderByDesc('created_at')
                ->limit($limit - $suggested->count())
                ->get();

            $suggested = $suggested->concat($fill);
        }

        return $suggested;
    }

    private function inferCategoriesFromActivity(User $user): Collection
    {
        $keywords = AssistantInteraction::query()
            ->where('user_id', $user->id)
            ->where('created_at', '>=', Carbon::now()->subDays(14))
            ->orderByDesc('created_at')
            ->limit(10)
            ->pluck('user_message')
            ->filter()
            ->implode(' ');

        $map = [
            'hr' => ['leave', 'payroll', 'benefit', 'vacation', 'holiday'],
            'it' => ['password', 'login', 'computer', 'software', 'vpn', 'email'],
            'policy' => ['policy', 'compliance', 'rule', 'regulation'],
            'onboarding' => ['onboard', 'new hire', 'first day', 'orientation'],
        ];

        $lower = Str::lower($keywords);
        $categories = collect();

        foreach ($map as $category => $terms) {
            foreach ($terms as $term) {
                if (Str::contains($lower, $term)) {
                    $categories->push($category);
                    break;
                }
            }
        }

        return $categories->unique()->values();
    }

    /**
     * @return array{articles: array, faqs: array, documents: array}
     */
    public function search(string $query, ?string $category = null, ?string $type = null): array
    {
        $term = '%'.addcslashes($query, '%_\\').'%';
        $results = ['articles' => [], 'faqs' => [], 'documents' => []];

        if ($type === null || $type === 'article') {
            $articleQuery = KnowledgeArticle::query()
                ->with('author:id,name')
                ->where('is_current', true)
                ->where(function ($q) use ($term) {
                    $q->where('title', 'like', $term)
                        ->orWhere('content', 'like', $term);
                });

            if ($category) {
                $articleQuery->where('category', $category);
            }

            $results['articles'] = $articleQuery->orderByDesc('updated_at')->limit(20)->get()->all();
        }

        if ($type === null || $type === 'faq') {
            $faqQuery = KnowledgeFaq::query()
                ->where(function ($q) use ($term) {
                    $q->where('question', 'like', $term)
                        ->orWhere('answer', 'like', $term);
                });

            if ($category) {
                $faqQuery->where('category', $category);
            }

            $results['faqs'] = $faqQuery->orderBy('sort_order')->limit(20)->get()->all();
        }

        if ($type === null || $type === 'document') {
            $docQuery = KnowledgeDocument::query()
                ->with('uploader:id,name')
                ->where('is_current', true)
                ->where(function ($q) use ($term) {
                    $q->where('title', 'like', $term)
                        ->orWhere('description', 'like', $term);
                });

            $results['documents'] = $docQuery->orderByDesc('updated_at')->limit(20)->get()->all();
        }

        return $results;
    }

    public function statsForDashboard(): array
    {
        $since = Carbon::now()->subDays(30);

        $newArticles = KnowledgeArticle::where('is_current', true)
            ->where('created_at', '>=', $since)
            ->count();

        $newDocuments = KnowledgeDocument::where('is_current', true)
            ->where('created_at', '>=', $since)
            ->count();

        return [
            'recent_updates' => $newArticles + $newDocuments,
            'articles_count' => KnowledgeArticle::where('is_current', true)->count(),
            'faqs_count' => KnowledgeFaq::count(),
            'documents_count' => KnowledgeDocument::where('is_current', true)->count(),
            'new_articles_30d' => $newArticles,
            'new_documents_30d' => $newDocuments,
        ];
    }

    /**
     * @return array<int, string>
     */
    public function categories(): array
    {
        $fromArticles = KnowledgeArticle::where('is_current', true)->distinct()->pluck('category');
        $fromFaqs = KnowledgeFaq::distinct()->pluck('category');

        return $fromArticles->merge($fromFaqs)->unique()->sort()->values()->all();
    }

    public function canManage(User $user): bool
    {
        return in_array($user->role, [UserRole::Admin, UserRole::Manager], true);
    }
}
