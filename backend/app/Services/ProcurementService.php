<?php

namespace App\Services;

use App\Enums\InventoryItemStatus;
use App\Enums\PurchaseOrderStatus;
use App\Enums\StockMovementType;
use App\Enums\SupplierStatus;
use App\Enums\UserRole;
use App\Models\Item;
use App\Models\ProcurementAuditLog;
use App\Models\ProcurementHistory;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderLine;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProcurementService
{
    public function __construct(
        private NotificationService $notifications,
    ) {}

    public function canManage(User $user): bool
    {
        return in_array($user->role, [UserRole::Admin, UserRole::Manager], true);
    }

    public function overview(): array
    {
        $this->checkLowStockAlerts();

        return [
            'stats' => $this->statsForDashboard(),
            'categories' => Item::distinct()->orderBy('category')->pluck('category')->all(),
            'po_pipeline' => PurchaseOrderStatus::pipeline(),
        ];
    }

    /**
     * @return array{total_items: int, active_suppliers: int, pending_pos: int, low_stock_items: int}
     */
    public function statsForDashboard(): array
    {
        return [
            'total_items' => Item::count(),
            'active_suppliers' => Supplier::where('status', SupplierStatus::Active)->count(),
            'pending_pos' => PurchaseOrder::where('status', PurchaseOrderStatus::Pending)->count(),
            'low_stock_items' => Item::whereColumn('quantity', '<=', 'reorder_level')->count(),
        ];
    }

    public function addItem(User $actor, array $data): Item
    {
        $quantity = (int) ($data['quantity'] ?? 0);
        $item = Item::create([
            'name' => $data['name'],
            'category' => $data['category'],
            'quantity' => 0,
            'unit_price' => $data['unit_price'] ?? 0,
            'status' => InventoryItemStatus::OutOfStock,
            'sku' => $data['sku'] ?? null,
            'qr_token' => (string) Str::uuid(),
            'reorder_level' => $data['reorder_level'] ?? 10,
        ]);

        if ($quantity > 0) {
            $this->recordMovement(
                $actor,
                $item->fresh(),
                StockMovementType::In,
                $quantity,
                'initial_stock',
                $item->id,
                __('messages.inventory.initial_stock'),
            );
            $item = $item->fresh();
        }

        $this->audit($actor->id, 'item_created', 'item', $item->id,
            __('messages.inventory.audit_item_created', ['name' => $item->name]));
        $this->history($actor->id, 'item_created', 'item', $item->id,
            __('messages.inventory.history_item_created', ['name' => $item->name]),
            ['quantity' => $quantity]);

        $this->checkLowStockAlerts($item);

        return $item;
    }

    public function createPurchaseOrder(User $actor, array $data): PurchaseOrder
    {
        return DB::transaction(function () use ($actor, $data) {
            $lines = $data['items'] ?? [];
            if ($lines === []) {
                throw new \InvalidArgumentException('items required');
            }

            $poNumber = $this->nextPoNumber();
            $total = 0;
            $po = PurchaseOrder::create([
                'po_number' => $poNumber,
                'supplier_id' => $data['supplier_id'],
                'total_amount' => 0,
                'status' => PurchaseOrderStatus::Pending,
                'created_by' => $actor->id,
                'notes' => $data['notes'] ?? null,
            ]);

            foreach ($lines as $line) {
                $item = Item::findOrFail($line['inventory_item_id']);
                $qty = (int) $line['quantity'];
                $unitPrice = $line['unit_price'] ?? $item->unit_price;
                $lineTotal = round($qty * (float) $unitPrice, 2);
                $total += $lineTotal;

                PurchaseOrderLine::create([
                    'purchase_order_id' => $po->id,
                    'inventory_item_id' => $item->id,
                    'quantity' => $qty,
                    'unit_price' => $unitPrice,
                    'line_total' => $lineTotal,
                ]);
            }

            $po->update(['total_amount' => $total]);

            $po->load(['supplier', 'creator:id,name', 'lines.item']);

            $this->audit($actor->id, 'po_created', 'purchase_order', $po->id,
                __('messages.inventory.audit_po_created', ['number' => $po->po_number]),
                ['total' => $total]);
            $this->history($actor->id, 'po_created', 'purchase_order', $po->id,
                __('messages.inventory.history_po_created', ['number' => $po->po_number, 'total' => $total]));

            return $po;
        });
    }

    public function updatePurchaseOrderStatus(User $actor, PurchaseOrder $po, PurchaseOrderStatus $status): PurchaseOrder
    {
        if ($po->status === $status) {
            return $po->load(['supplier', 'creator:id,name', 'approver:id,name', 'lines.item']);
        }

        $previous = $po->status;
        $updates = ['status' => $status];

        if ($status === PurchaseOrderStatus::Approved) {
            $updates['approved_by'] = $actor->id;
            $updates['approved_at'] = now();
        }

        if ($status === PurchaseOrderStatus::Delivered) {
            $updates['delivered_at'] = now();
            if ($po->status !== PurchaseOrderStatus::Approved) {
                $updates['approved_by'] = $po->approved_by ?? $actor->id;
                $updates['approved_at'] = $po->approved_at ?? now();
            }
        }

        $po->update($updates);

        if ($status === PurchaseOrderStatus::Approved) {
            $this->notifications->notifyPurchaseOrderApproved($po);
        }

        if ($status === PurchaseOrderStatus::Delivered) {
            $this->receivePurchaseOrder($actor, $po);
        }

        $this->audit($actor->id, 'po_status', 'purchase_order', $po->id,
            __('messages.inventory.audit_po_status', [
                'number' => $po->po_number,
                'from' => $previous->value,
                'to' => $status->value,
            ]));
        $this->history($actor->id, 'po_status', 'purchase_order', $po->id,
            __('messages.inventory.history_po_status', [
                'number' => $po->po_number,
                'status' => $status->value,
            ]));

        return $po->fresh()->load(['supplier', 'creator:id,name', 'approver:id,name', 'lines.item']);
    }

    public function recordMovement(
        User $actor,
        Item $item,
        StockMovementType $type,
        int $quantity,
        ?string $referenceType = null,
        ?int $referenceId = null,
        ?string $notes = null,
    ): StockMovement {
        if ($quantity <= 0) {
            throw new \InvalidArgumentException('quantity must be positive');
        }

        if ($type === StockMovementType::Out && $item->quantity < $quantity) {
            throw new \RuntimeException('insufficient_stock');
        }

        if ($type === StockMovementType::In) {
            $item->quantity += $quantity;
        } else {
            $item->quantity -= $quantity;
        }

        $item->syncStatusFromQuantity();
        $item->save();

        $movement = StockMovement::create([
            'inventory_item_id' => $item->id,
            'type' => $type,
            'quantity' => $quantity,
            'moved_at' => now(),
            'user_id' => $actor->id,
            'reference_type' => $referenceType,
            'reference_id' => $referenceId,
            'notes' => $notes,
        ]);

        $this->audit($actor->id, 'stock_movement', 'stock_movement', $movement->id,
            __('messages.inventory.audit_stock_movement', [
                'name' => $item->name,
                'type' => $type->value,
                'qty' => $quantity,
            ]));
        $this->history($actor->id, 'stock_movement', 'item', $item->id,
            __('messages.inventory.history_stock_movement', [
                'name' => $item->name,
                'type' => $type->value,
                'qty' => $quantity,
            ]));

        $this->checkLowStockAlerts($item->fresh());

        return $movement->load(['item:id,name', 'user:id,name']);
    }

    public function lookupByQr(string $token): ?Item
    {
        return Item::where('qr_token', $token)->first();
    }

    public function qrPayload(Item $item): string
    {
        $base = rtrim(config('app.frontend_url', config('app.url')), '/');

        return $base.'/inventory?scan='.$item->qr_token;
    }

    public function checkLowStockAlerts(?Item $specific = null): int
    {
        $query = Item::query()->whereColumn('quantity', '<=', 'reorder_level');

        if ($specific) {
            $query->where('id', $specific->id);
        }

        $alerted = 0;
        $cooldown = Carbon::now()->subHours(24);

        foreach ($query->get() as $item) {
            if ($item->low_stock_notified_at && $item->low_stock_notified_at->gt($cooldown)) {
                continue;
            }

            $this->notifications->notifyInventoryLowStock($item);
            $item->update(['low_stock_notified_at' => now()]);
            $alerted++;
        }

        return $alerted;
    }

    private function receivePurchaseOrder(User $actor, PurchaseOrder $po): void
    {
        $po->load('lines.item');

        foreach ($po->lines as $line) {
            $item = $line->item;
            $this->recordMovement(
                $actor,
                $item,
                StockMovementType::In,
                $line->quantity,
                'purchase_order',
                $po->id,
                __('messages.inventory.po_receipt', ['number' => $po->po_number]),
            );
        }
    }

    private function nextPoNumber(): string
    {
        $year = now()->format('Y');
        $last = PurchaseOrder::where('po_number', 'like', "PO-{$year}-%")
            ->orderByDesc('id')
            ->value('po_number');

        $seq = 1;
        if ($last && preg_match('/PO-\d{4}-(\d+)/', $last, $m)) {
            $seq = (int) $m[1] + 1;
        }

        return sprintf('PO-%s-%04d', $year, $seq);
    }

    public function audit(
        ?int $userId,
        string $action,
        string $entityType,
        ?int $entityId,
        string $description,
        ?array $meta = null,
    ): void {
        ProcurementAuditLog::create([
            'user_id' => $userId,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'description' => $description,
            'meta' => $meta,
            'occurred_at' => now(),
        ]);
    }

    public function history(
        ?int $userId,
        string $eventType,
        string $entityType,
        ?int $entityId,
        string $summary,
        ?array $payload = null,
    ): void {
        ProcurementHistory::create([
            'user_id' => $userId,
            'event_type' => $eventType,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'summary' => $summary,
            'payload' => $payload,
            'occurred_at' => now(),
        ]);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function exportItems(?string $category = null, ?string $status = null): array
    {
        $query = Item::query()->orderBy('name');

        if ($category) {
            $query->where('category', $category);
        }

        if ($status) {
            $query->where('status', $status);
        }

        return $query->get()->map(fn (Item $i) => [
            'id' => $i->id,
            'name' => $i->name,
            'category' => $i->category,
            'quantity' => $i->quantity,
            'unit_price' => (float) $i->unit_price,
            'status' => $i->status->value,
            'sku' => $i->sku,
            'reorder_level' => $i->reorder_level,
        ])->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function exportPurchaseOrders(?string $status = null): array
    {
        $query = PurchaseOrder::query()->with('supplier:id,name')->orderByDesc('created_at');

        if ($status) {
            $query->where('status', $status);
        }

        return $query->get()->map(fn (PurchaseOrder $po) => [
            'po_number' => $po->po_number,
            'supplier' => $po->supplier?->name,
            'total_amount' => (float) $po->total_amount,
            'status' => $po->status->value,
            'created_at' => $po->created_at?->toIso8601String(),
            'delivered_at' => $po->delivered_at?->toIso8601String(),
        ])->all();
    }
}
