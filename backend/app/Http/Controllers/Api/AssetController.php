<?php

namespace App\Http\Controllers\Api;

use App\Enums\AssetStatus;
use App\Enums\AssetType;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Asset\AssignAssetRequest;
use App\Http\Requests\Asset\ScheduleMaintenanceRequest;
use App\Http\Requests\Asset\StoreAssetRequest;
use App\Http\Resources\AssetResource;
use App\Models\Asset;
use App\Models\AssetMaintenance;
use App\Models\User;
use App\Services\AssetService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Str;

class AssetController extends Controller
{
    public function __construct(
        private AssetService $assets,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        if ($this->canManage($request->user('api'))) {
            $this->assets->sendDueReminders();
        }

        $query = Asset::query()
            ->with(['activeAssignment.employee:id,name']);

        $this->applyFilters($query, $request);

        return AssetResource::collection($query->orderBy('name')->get());
    }

    public function store(StoreAssetRequest $request): JsonResponse
    {
        $user = $request->user('api');

        if (! $this->canManage($user)) {
            return response()->json(['message' => __('messages.assets.forbidden')], 403);
        }

        $asset = $this->assets->createAsset($user, $request->validated(), $request);
        $asset->load(['activeAssignment.employee:id,name']);

        return response()->json([
            'message' => __('messages.assets.created'),
            'data' => new AssetResource($asset),
        ], 201);
    }

    public function show(Asset $asset): JsonResponse
    {
        $asset->load(['activeAssignment.employee:id,name,email']);

        return response()->json([
            'data' => new AssetResource($asset),
        ]);
    }

    public function history(Asset $asset): JsonResponse
    {
        return response()->json([
            'data' => $this->assets->history($asset),
        ]);
    }

    public function assign(AssignAssetRequest $request, Asset $asset): JsonResponse
    {
        $user = $request->user('api');

        if (! $this->canManage($user)) {
            return response()->json(['message' => __('messages.assets.forbidden')], 403);
        }

        try {
            $assignment = $this->assets->assignAsset($user, $asset, $request->validated(), $request);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $asset->load(['activeAssignment.employee:id,name']);

        return response()->json([
            'message' => __('messages.assets.assigned'),
            'data' => [
                'assignment' => $assignment,
                'asset' => new AssetResource($asset),
            ],
        ]);
    }

    public function returnAsset(Request $request, Asset $asset): JsonResponse
    {
        $user = $request->user('api');

        if (! $this->canManage($user)) {
            return response()->json(['message' => __('messages.assets.forbidden')], 403);
        }

        try {
            $this->assets->returnAsset($user, $asset, $request, $request->input('return_date'));
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $asset->load(['activeAssignment.employee:id,name']);

        return response()->json([
            'message' => __('messages.assets.returned'),
            'data' => new AssetResource($asset->fresh()),
        ]);
    }

    public function scheduleMaintenance(
        ScheduleMaintenanceRequest $request,
        Asset $asset,
    ): JsonResponse {
        $user = $request->user('api');

        if (! $this->canManage($user)) {
            return response()->json(['message' => __('messages.assets.forbidden')], 403);
        }

        $maintenance = $this->assets->scheduleMaintenance(
            $user,
            $asset,
            $request->validated(),
            $request,
        );

        return response()->json([
            'message' => __('messages.assets.maintenance_scheduled'),
            'data' => $maintenance,
        ], 201);
    }

    public function completeMaintenance(Request $request, AssetMaintenance $maintenance): JsonResponse
    {
        $user = $request->user('api');

        if (! $this->canManage($user)) {
            return response()->json(['message' => __('messages.assets.forbidden')], 403);
        }

        $record = $this->assets->completeMaintenance($user, $maintenance, $request);

        return response()->json([
            'message' => __('messages.assets.maintenance_completed'),
            'data' => $record,
        ]);
    }

    public function lookupByQr(Request $request): JsonResponse
    {
        $token = $request->query('token');
        if (! $token) {
            return response()->json(['message' => __('messages.assets.invalid_qr')], 422);
        }

        $asset = Asset::where('qr_token', $token)
            ->with(['activeAssignment.employee:id,name'])
            ->first();

        if (! $asset) {
            return response()->json(['message' => __('messages.assets.not_found')], 404);
        }

        return response()->json([
            'data' => [
                'asset' => new AssetResource($asset),
                'history' => $this->assets->history($asset),
            ],
        ]);
    }

    public function qr(Asset $asset): \Illuminate\Http\Response
    {
        $url = $this->assets->qrPayload($asset);
        $svg = $this->generateQrSvg($url);

        return Response::make($svg, 200, [
            'Content-Type' => 'image/svg+xml',
        ]);
    }

    public function export(Request $request): JsonResponse
    {
        $user = $request->user('api');

        if (! $this->canManage($user)) {
            return response()->json(['message' => __('messages.assets.forbidden')], 403);
        }

        $query = Asset::query()->with(['activeAssignment.employee:id,name']);
        $this->applyFilters($query, $request);

        $rows = $query->orderBy('name')->get()->map(fn (Asset $asset) => [
            'id' => $asset->id,
            'name' => $asset->name,
            'type' => $asset->type->value,
            'serial_number' => $asset->serial_number,
            'purchase_date' => $asset->purchase_date?->format('Y-m-d'),
            'status' => $asset->status->value,
            'assigned_to' => $asset->activeAssignment?->employee?->name,
            'assigned_date' => $asset->activeAssignment?->assigned_date?->format('Y-m-d'),
        ]);

        return response()->json(['data' => $rows]);
    }

    private function applyFilters(Builder $query, Request $request): void
    {
        if ($request->filled('type')) {
            $query->where('type', $request->string('type'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->boolean('assigned_only')) {
            $query->whereHas('assignments', fn (Builder $q) => $q->whereNull('return_date'));
        }
    }

    private function generateQrSvg(string $data): string
    {
        if (class_exists(\chillerlan\QRCode\QRCode::class)) {
            return (new \chillerlan\QRCode\QRCode)->render($data);
        }

        $encoded = urlencode($data);
        $size = 200;

        return '<?xml version="1.0" encoding="UTF-8"?>'
            .'<svg xmlns="http://www.w3.org/2000/svg" width="'.$size.'" height="'.$size.'" viewBox="0 0 '.$size.' '.$size.'">'
            .'<rect width="100%" height="100%" fill="#fff"/>'
            .'<text x="50%" y="45%" text-anchor="middle" font-size="11" fill="#334155">QR</text>'
            .'<text x="50%" y="58%" text-anchor="middle" font-size="8" fill="#64748b">'.htmlspecialchars(Str::limit($data, 40)).'</text>'
            .'</svg>';
    }

    private function canManage(User $user): bool
    {
        return $user->hasAnyRole([
            UserRole::Admin->value,
            UserRole::Manager->value,
        ]);
    }
}
