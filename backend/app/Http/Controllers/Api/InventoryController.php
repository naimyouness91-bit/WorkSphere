<?php

namespace App\Http\Controllers\Api;

use App\Enums\PurchaseOrderStatus;
use App\Enums\StockMovementType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Inventory\StoreItemRequest;
use App\Http\Requests\Inventory\StorePurchaseOrderRequest;
use App\Http\Requests\Inventory\StoreStockMovementRequest;
use App\Http\Requests\Inventory\UpdatePurchaseOrderStatusRequest;
use App\Http\Resources\ItemResource;
use App\Http\Resources\PurchaseOrderResource;
use App\Http\Resources\StockMovementResource;
use App\Http\Resources\SupplierResource;
use App\Models\Item;
use App\Models\ProcurementAuditLog;
use App\Models\ProcurementHistory;
use App\Models\PurchaseOrder;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Models\User;
use App\Services\ProcurementService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Str;

class InventoryController extends Controller
{
    public function __construct(
        private ProcurementService $procurement,
    ) {}

    public function overview(): JsonResponse
    {
        return response()->json(['data' => $this->procurement->overview()]);
    }

    public function getItems(Request $request): AnonymousResourceCollection
    {
        $query = Item::query()->orderBy('name');
        $this->applyItemFilters($query, $request);

        return ItemResource::collection($query->get());
    }

    public function addItem(StoreItemRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        if (! $this->procurement->canManage($user)) {
            return response()->json(['message' => __('messages.inventory.forbidden')], 403);
        }

        $item = $this->procurement->addItem($user, $request->validated());

        return response()->json([
            'message' => __('messages.inventory.item_created'),
            'data' => new ItemResource($item),
        ], 201);
    }

    public function showItem(Item $item): JsonResponse
    {
        return response()->json(['data' => new ItemResource($item)]);
    }

    public function getSuppliers(Request $request): AnonymousResourceCollection
    {
        $query = Supplier::query()->withCount('purchaseOrders')->orderBy('name');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return SupplierResource::collection($query->get());
    }

    public function getPurchaseOrders(Request $request): AnonymousResourceCollection
    {
        $query = PurchaseOrder::query()
            ->with(['supplier', 'creator:id,name', 'approver:id,name', 'lines.item'])
            ->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return PurchaseOrderResource::collection($query->get());
    }

    public function createPurchaseOrder(StorePurchaseOrderRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        if (! $this->procurement->canManage($user)) {
            return response()->json(['message' => __('messages.inventory.forbidden')], 403);
        }

        try {
            $po = $this->procurement->createPurchaseOrder($user, $request->validated());
        } catch (\InvalidArgumentException) {
            return response()->json(['message' => __('messages.inventory.po_items_required')], 422);
        }

        return response()->json([
            'message' => __('messages.inventory.po_created'),
            'data' => new PurchaseOrderResource($po),
        ], 201);
    }

    public function updatePurchaseOrderStatus(
        UpdatePurchaseOrderStatusRequest $request,
        PurchaseOrder $purchaseOrder,
    ): JsonResponse {
        /** @var User $user */
        $user = auth('api')->user();

        if (! $this->procurement->canManage($user)) {
            return response()->json(['message' => __('messages.inventory.forbidden')], 403);
        }

        $po = $this->procurement->updatePurchaseOrderStatus(
            $user,
            $purchaseOrder,
            PurchaseOrderStatus::from($request->validated('status')),
        );

        return response()->json([
            'message' => __('messages.inventory.po_updated'),
            'data' => new PurchaseOrderResource($po),
        ]);
    }

    public function getStockMovements(Request $request): AnonymousResourceCollection
    {
        $query = StockMovement::query()
            ->with(['item:id,name,category', 'user:id,name'])
            ->orderByDesc('moved_at');

        if ($request->filled('inventory_item_id')) {
            $query->where('inventory_item_id', $request->integer('inventory_item_id'));
        }

        if ($request->filled('type')) {
            $query->where('type', $request->string('type'));
        }

        return StockMovementResource::collection($query->limit(200)->get());
    }

    public function recordStockMovement(StoreStockMovementRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        if (! $this->procurement->canManage($user)) {
            return response()->json(['message' => __('messages.inventory.forbidden')], 403);
        }

        $item = Item::findOrFail($request->integer('inventory_item_id'));

        try {
            $movement = $this->procurement->recordMovement(
                $user,
                $item,
                StockMovementType::from($request->validated('type')),
                (int) $request->validated('quantity'),
                'manual',
                null,
                $request->validated('notes'),
            );
        } catch (\RuntimeException) {
            return response()->json(['message' => __('messages.inventory.insufficient_stock')], 422);
        }

        return response()->json([
            'message' => __('messages.inventory.movement_recorded'),
            'data' => new StockMovementResource($movement),
        ], 201);
    }

    public function lookupByQr(Request $request): JsonResponse
    {
        $token = $request->query('token');
        if (! $token) {
            return response()->json(['message' => __('messages.inventory.invalid_qr')], 422);
        }

        $item = $this->procurement->lookupByQr($token);
        if (! $item) {
            return response()->json(['message' => __('messages.inventory.item_not_found')], 404);
        }

        return response()->json(['data' => new ItemResource($item)]);
    }

    public function itemQr(Item $item): \Illuminate\Http\Response
    {
        $url = $this->procurement->qrPayload($item);
        $svg = $this->generateQrSvg($url);

        return Response::make($svg, 200, ['Content-Type' => 'image/svg+xml']);
    }

    public function exportItems(Request $request): JsonResponse
    {
        if (! $this->procurement->canManage($request->user('api'))) {
            return response()->json(['message' => __('messages.inventory.forbidden')], 403);
        }

        return response()->json([
            'data' => $this->procurement->exportItems(
                $request->string('category')->toString() ?: null,
                $request->string('status')->toString() ?: null,
            ),
        ]);
    }

    public function exportPurchaseOrders(Request $request): JsonResponse
    {
        if (! $this->procurement->canManage($request->user('api'))) {
            return response()->json(['message' => __('messages.inventory.forbidden')], 403);
        }

        return response()->json([
            'data' => $this->procurement->exportPurchaseOrders(
                $request->string('status')->toString() ?: null,
            ),
        ]);
    }

    public function auditLogs(): JsonResponse
    {
        $logs = ProcurementAuditLog::query()
            ->with('user:id,name')
            ->orderByDesc('occurred_at')
            ->limit(100)
            ->get();

        return response()->json(['data' => $logs]);
    }

    public function history(): JsonResponse
    {
        $rows = ProcurementHistory::query()
            ->with('user:id,name')
            ->orderByDesc('occurred_at')
            ->limit(100)
            ->get();

        return response()->json(['data' => $rows]);
    }

    private function applyItemFilters(Builder $query, Request $request): void
    {
        if ($request->filled('category')) {
            $query->where('category', $request->string('category'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->boolean('low_stock')) {
            $query->whereColumn('quantity', '<=', 'reorder_level');
        }
    }

    private function generateQrSvg(string $data): string
    {
        if (class_exists(\chillerlan\QRCode\QRCode::class)) {
            return (new \chillerlan\QRCode\QRCode)->render($data);
        }

        return '<?xml version="1.0" encoding="UTF-8"?>'
            .'<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">'
            .'<rect width="100%" height="100%" fill="#fff"/>'
            .'<text x="50%" y="45%" text-anchor="middle" font-size="11" fill="#334155">QR</text>'
            .'<text x="50%" y="58%" text-anchor="middle" font-size="8" fill="#64748b">'.htmlspecialchars(Str::limit($data, 40)).'</text>'
            .'</svg>';
    }
}
