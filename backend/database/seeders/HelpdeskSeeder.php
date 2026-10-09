<?php

namespace Database\Seeders;

use App\Enums\TicketStatus;
use App\Models\SupportCategory;
use App\Models\Ticket;
use App\Models\User;
use App\Services\HelpdeskService;
use Illuminate\Database\Seeder;

class HelpdeskSeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'IT Support', 'slug' => 'it', 'description' => 'Hardware, software, access, and connectivity issues.'],
            ['name' => 'Human Resources', 'slug' => 'hr', 'description' => 'Benefits, payroll questions, and HR policies.'],
            ['name' => 'Finance', 'slug' => 'finance', 'description' => 'Expenses, invoices, and budget inquiries.'],
            ['name' => 'General', 'slug' => 'other', 'description' => 'Other workplace support requests.'],
        ];

        foreach ($categories as $cat) {
            SupportCategory::updateOrCreate(['slug' => $cat['slug']], $cat + ['is_active' => true]);
        }

        if (Ticket::count() > 0) {
            return;
        }

        $employee = User::where('role', 'employee')->first() ?? User::first();
        $manager = User::where('role', 'manager')->first() ?? User::where('role', 'admin')->first();

        if (! $employee) {
            return;
        }

        /** @var HelpdeskService $helpdesk */
        $helpdesk = app(HelpdeskService::class);

        $t1 = $helpdesk->createTicket($employee, [
            'title' => 'VPN connection drops intermittently',
            'description' => 'Remote VPN disconnects every 30–45 minutes since last Windows update.',
            'category' => 'it',
            'priority' => 'high',
        ]);

        if ($manager) {
            $helpdesk->assignTicket($manager, $t1, $manager->id);
            $helpdesk->updateTicketStatus($manager, $t1, TicketStatus::InProgress);
        }

        $helpdesk->createTicket($employee, [
            'title' => 'Update home address in HR system',
            'description' => 'Need to change mailing address after relocation.',
            'category' => 'hr',
            'priority' => 'low',
        ]);

        $t3 = $helpdesk->createTicket($employee, [
            'title' => 'Expense report stuck in pending',
            'description' => 'March travel expense #4521 has been pending for two weeks.',
            'category' => 'finance',
            'priority' => 'medium',
        ]);

        if ($manager) {
            $helpdesk->updateTicketStatus($manager, $t3, TicketStatus::Resolved, 'Approved and reimbursed.');
        }
    }
}
