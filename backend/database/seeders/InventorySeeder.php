<?php

namespace Database\Seeders;

use App\Enums\PurchaseOrderStatus;
use App\Enums\SupplierStatus;
use App\Models\Item;
use App\Models\Supplier;
use App\Models\User;
use App\Services\ProcurementService;
use Illuminate\Database\Seeder;

class InventorySeeder extends Seeder
{
    public function run(): void
    {
        $suppliers = [
            ['name' => 'TechSupply Co.', 'contact_info' => 'orders@techsupply.example | +1 555-0100', 'rating' => 4.5],
            ['name' => 'OfficeMart', 'contact_info' => 'procurement@officemart.example', 'rating' => 4.2],
            ['name' => 'Global Parts Ltd', 'contact_info' => 'sales@globalparts.example', 'rating' => 3.8],
        ];

        foreach ($suppliers as $s) {
            Supplier::updateOrCreate(
                ['name' => $s['name']],
                $s + ['status' => SupplierStatus::Active],
            );
        }

        if (Item::count() > 0) {
            return;
        }

        $manager = User::where('role', 'manager')->first() ?? User::where('role', 'admin')->first();
        if (! $manager) {
            return;
        }

        /** @var ProcurementService $procurement */
        $procurement = app(ProcurementService::class);

        $laptop = $procurement->addItem($manager, [
            'name' => 'Laptop Dell Latitude 5540',
            'category' => 'equipment',
            'quantity' => 25,
            'unit_price' => 899.00,
            'reorder_level' => 5,
        ]);

        $procurement->addItem($manager, [
            'name' => 'Wireless Mouse',
            'category' => 'accessories',
            'quantity' => 8,
            'unit_price' => 24.99,
            'reorder_level' => 10,
        ]);

        $procurement->addItem($manager, [
            'name' => 'A4 Paper Ream (500 sheets)',
            'category' => 'office_supplies',
            'quantity' => 120,
            'unit_price' => 4.50,
            'reorder_level' => 20,
        ]);

        $supplier = Supplier::first();
        if ($supplier) {
            $po = $procurement->createPurchaseOrder($manager, [
                'supplier_id' => $supplier->id,
                'notes' => 'Q2 laptop refresh',
                'items' => [
                    ['inventory_item_id' => $laptop->id, 'quantity' => 10, 'unit_price' => 850.00],
                ],
            ]);

            $procurement->updatePurchaseOrderStatus($manager, $po, PurchaseOrderStatus::Approved);
        }
    }
}
