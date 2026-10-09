<?php

namespace App\Http\Controllers\Api;

use App\Enums\ActivityAction;
use App\Enums\UserRole;
use App\Services\ActivityLogService;
use App\Services\GamificationService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Document\StoreDocumentRequest;
use App\Http\Resources\DocumentResource;
use App\Models\Document;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DocumentController extends Controller
{
    public function __construct(
        private ActivityLogService $activityLog,
        private GamificationService $gamification,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        /** @var User $user */
        $user = $request->user('api');

        $query = Document::query()
            ->with('employee')
            ->latest('uploaded_at');

        if ($this->isEmployeeOnly($user)) {
            $query->where('employee_id', $user->id);
        }

        return DocumentResource::collection($query->get());
    }

    public function store(StoreDocumentRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');
        $file = $request->file('file');

        $path = $file->store('documents/'.$user->id, 'public');

        $document = Document::create([
            'title' => $request->validated('title'),
            'description' => $request->validated('description'),
            'file_path' => $path,
            'original_filename' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType() ?? 'application/octet-stream',
            'file_size' => $file->getSize(),
            'employee_id' => $user->id,
            'uploaded_at' => now(),
        ]);

        $document->load('employee');

        $this->activityLog->log(
            $user,
            ActivityAction::DocumentUploaded,
            __('messages.activity.document_uploaded', [
                'name' => $user->name,
                'title' => $document->title,
            ]),
            ['document_id' => $document->id],
        );

        $this->gamification->onDocumentUploaded($user->id, $document->id);

        return response()->json([
            'message' => __('messages.documents.uploaded'),
            'data' => new DocumentResource($document),
        ], 201);
    }

    public function download(Document $document): StreamedResponse|JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        if (! $this->canAccess($user, $document)) {
            return response()->json(['message' => __('messages.documents.forbidden')], 403);
        }

        if (! Storage::disk('public')->exists($document->file_path)) {
            return response()->json(['message' => __('messages.documents.file_missing')], 404);
        }

        return Storage::disk('public')->download(
            $document->file_path,
            $document->original_filename,
        );
    }

    public function preview(Document $document): StreamedResponse|JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        if (! $this->canAccess($user, $document)) {
            return response()->json(['message' => __('messages.documents.forbidden')], 403);
        }

        if (! $document->isPreviewable()) {
            return response()->json(['message' => __('messages.documents.preview_unavailable')], 422);
        }

        if (! Storage::disk('public')->exists($document->file_path)) {
            return response()->json(['message' => __('messages.documents.file_missing')], 404);
        }

        return Storage::disk('public')->response(
            $document->file_path,
            $document->original_filename,
            [
                'Content-Type' => $document->mime_type,
                'Content-Disposition' => 'inline; filename="'.$document->original_filename.'"',
            ],
        );
    }

    public function destroy(Document $document): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        if (! $this->canDelete($user, $document)) {
            return response()->json(['message' => __('messages.documents.forbidden')], 403);
        }

        $title = $document->title;
        $document->deleteStoredFile();
        $document->delete();

        $this->activityLog->log(
            $user,
            ActivityAction::DocumentDeleted,
            __('messages.activity.document_deleted', [
                'name' => $user->name,
                'title' => $title,
            ]),
            ['document_id' => $document->id],
        );

        return response()->json([
            'message' => __('messages.documents.deleted'),
        ]);
    }

    private function isEmployeeOnly(User $user): bool
    {
        return $user->role === UserRole::Employee;
    }

    private function canViewAll(User $user): bool
    {
        return $user->hasAnyRole([
            UserRole::Admin->value,
            UserRole::Manager->value,
        ]);
    }

    private function canAccess(User $user, Document $document): bool
    {
        if ($this->canViewAll($user)) {
            return true;
        }

        return $document->isOwnedBy($user);
    }

    private function canDelete(User $user, Document $document): bool
    {
        if ($user->role === UserRole::Admin) {
            return true;
        }

        return $document->isOwnedBy($user);
    }
}
