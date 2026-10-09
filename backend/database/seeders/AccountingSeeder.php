<?php

namespace Database\Seeders;

use App\Models\Client;
use App\Models\Invoice;
use App\Models\User;
use App\Services\AccountingService;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class AccountingSeeder extends Seeder
{
    public function run(): void
    {
        if (Invoice::count() > 0) {
            return;
        }

        $manager = User::where('role', 'manager')->first() ?? User::where('role', 'admin')->first();
        $client = Client::first();

        if (! $manager || ! $client) {
            return;
        }

        /** @var AccountingService $accounting */
        $accounting = app(AccountingService::class);

        $accounting->createInvoice($manager, [
            'client_id' => $client->id,
            'amount' => 12500.00,
            'due_date' => Carbon::now()->addDays(14)->toDateString(),
            'notes' => 'Q2 consulting services',
        ]);

        $overdue = $accounting->createInvoice($manager, [
            'client_id' => $client->id,
            'amount' => 4800.00,
            'due_date' => Carbon::now()->subDays(5)->toDateString(),
            'notes' => 'January support retainer',
        ]);

        $accounting->processOverdueInvoices();
    }
}
