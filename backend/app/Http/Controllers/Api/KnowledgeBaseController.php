<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Knowledge\RateArticleRequest;
use App\Http\Requests\Knowledge\StoreKnowledgeArticleRequest;
use App\Http\Requests\Knowledge\StoreKnowledgeDocumentRequest;
use App\Http\Resources\KnowledgeArticleResource;
use App\Http\Resources\KnowledgeDocumentResource;
use App\Http\Resources\KnowledgeFaqResource;
use App\Models\KnowledgeArticle;
use App\Models\KnowledgeDocument;
use App\Models\KnowledgeFaq;
use App\Models\User;
use App\Services\KnowledgeBaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class KnowledgeBaseController extends Controller
{
    public function __construct(
        private KnowledgeBaseService $knowledge,
    ) {}

    public function overview(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        $suggested = $this->knowledge->suggestedArticles($user);

        return response()->json([
            'data' => [
                'stats' => $this->knowledge->statsForDashboard(),
                'categories' => $this->knowledge->categories(),
                'can_manage' => $this->knowledge->canManage($user),
                'suggested_articles' => KnowledgeArticleResource::collection($suggested),
            ],
        ]);
    }

    public function getArticles(Request $request): AnonymousResourceCollection
    {
        $query = KnowledgeArticle::query()
            ->with('author:id,name')
            ->where('is_current', true)
            ->orderByDesc('updated_at');

        if ($request->filled('category')) {
            $query->where('category', $request->string('category'));
        }

        $articles = $query->get();
        $user = $request->user('api');

        if ($user) {
            $articles->each(function (KnowledgeArticle $article) use ($user) {
                $article->user_rating = $this->knowledge->userRatingForArticle($user, $article);
            });
        }

        return KnowledgeArticleResource::collection($articles);
    }

    public function addArticle(StoreKnowledgeArticleRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        if (! $this->knowledge->canManage($user)) {
            return response()->json(['message' => __('messages.knowledge.forbidden')], 403);
        }

        $article = $this->knowledge->createArticle($user, $request->validated());
        $article->user_rating = null;

        return response()->json([
            'message' => __('messages.knowledge.article_created'),
            'data' => new KnowledgeArticleResource($article),
        ], 201);
    }

    public function showArticle(Request $request, KnowledgeArticle $article): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        $article->load('author:id,name');
        $this->knowledge->recordArticleView($user, $article);
        $article->user_rating = $this->knowledge->userRatingForArticle($user, $article);

        return response()->json([
            'data' => new KnowledgeArticleResource($article),
        ]);
    }

    public function articleVersions(KnowledgeArticle $article): JsonResponse
    {
        $versions = KnowledgeArticle::versionsForCode($article->code)
            ->with('author:id,name')
            ->get();

        return response()->json([
            'data' => KnowledgeArticleResource::collection($versions),
        ]);
    }

    public function rateArticle(RateArticleRequest $request, KnowledgeArticle $article): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        $counts = $this->knowledge->rateArticle($user, $article, $request->boolean('helpful'));

        return response()->json([
            'message' => __('messages.knowledge.rating_saved'),
            'data' => array_merge($counts, [
                'user_rating' => $request->boolean('helpful'),
            ]),
        ]);
    }

    public function getFAQs(Request $request): AnonymousResourceCollection
    {
        $query = KnowledgeFaq::query()->orderBy('sort_order')->orderBy('id');

        if ($request->filled('category')) {
            $query->where('category', $request->string('category'));
        }

        return KnowledgeFaqResource::collection($query->get());
    }

    public function getDocuments(Request $request): AnonymousResourceCollection
    {
        $query = KnowledgeDocument::query()
            ->with('uploader:id,name')
            ->where('is_current', true)
            ->orderByDesc('updated_at');

        return KnowledgeDocumentResource::collection($query->get());
    }

    public function uploadDocument(StoreKnowledgeDocumentRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        if (! $this->knowledge->canManage($user)) {
            return response()->json(['message' => __('messages.knowledge.forbidden')], 403);
        }

        $document = $this->knowledge->uploadDocument(
            $user,
            $request->validated(),
            $request->file('file'),
        );

        return response()->json([
            'message' => __('messages.knowledge.document_uploaded'),
            'data' => new KnowledgeDocumentResource($document),
        ], 201);
    }

    public function documentVersions(KnowledgeDocument $document): JsonResponse
    {
        $versions = KnowledgeDocument::versionsForCode($document->code)
            ->with('uploader:id,name')
            ->get();

        return response()->json([
            'data' => KnowledgeDocumentResource::collection($versions),
        ]);
    }

    public function downloadDocument(KnowledgeDocument $document): StreamedResponse|JsonResponse
    {
        if (! Storage::disk('local')->exists($document->file_path)) {
            return response()->json(['message' => __('messages.knowledge.file_missing')], 404);
        }

        return Storage::disk('local')->download($document->file_path, $document->original_filename);
    }

    public function previewDocument(KnowledgeDocument $document): StreamedResponse|JsonResponse
    {
        if (! Storage::disk('local')->exists($document->file_path)) {
            return response()->json(['message' => __('messages.knowledge.file_missing')], 404);
        }

        return response()->file(
            Storage::disk('local')->path($document->file_path),
            ['Content-Type' => $document->mime_type],
        );
    }

    public function search(Request $request): JsonResponse
    {
        $request->validate([
            'q' => ['required', 'string', 'min:2', 'max:200'],
            'category' => ['nullable', 'string', 'max:80'],
            'type' => ['nullable', 'string', 'in:article,faq,document'],
        ]);

        $results = $this->knowledge->search(
            $request->string('q')->toString(),
            $request->filled('category') ? $request->string('category')->toString() : null,
            $request->filled('type') ? $request->string('type')->toString() : null,
        );

        return response()->json([
            'data' => [
                'articles' => KnowledgeArticleResource::collection(collect($results['articles'])),
                'faqs' => KnowledgeFaqResource::collection(collect($results['faqs'])),
                'documents' => KnowledgeDocumentResource::collection(collect($results['documents'])),
            ],
        ]);
    }
}
