<?php

namespace Database\Seeders;

use App\Enums\ClientStatus;
use App\Enums\CrmInteractionType;
use App\Enums\DealStage;
use App\Enums\DealStatus;
use App\Enums\PartnerStatus;
use App\Models\Client;
use App\Models\CrmInteraction;
use App\Models\Deal;
use App\Models\Partner;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class CrmSeeder extends Seeder
{
    public function run(): void
    {
        $owner = User::query()->where('role', 'manager')->first()
            ?? User::query()->where('role', 'admin')->first();

        if (! $owner) {
            return;
        }

        $client = Client::firstOrCreate(
            ['email' => 'contact@acmecorp.example'],
            [
                'name' => 'Jordan Lee',
                'company' => 'Acme Corp',
                'phone' => '+1-555-0100',
                'status' => ClientStatus::Active,
                'owner_id' => $owner->id,
            ],
        );

        Partner::firstOrCreate(
            ['name' => 'TechAlliance', 'organization' => 'Tech Alliance Group'],
            [
                'contact_info' => 'partnerships@techalliance.example | +1-555-0200',
                'status' => PartnerStatus::Active,
                'owner_id' => $owner->id,
            ],
        );

        CrmInteraction::firstOrCreate(
            [
                'client_id' => $client->id,
                'type' => CrmInteractionType::Meeting,
                'occurred_at' => Carbon::now()->subDays(2),
            ],
            [
                'notes' => 'Quarterly business review — discussed expansion.',
                'logged_by' => $owner->id,
                'source' => 'manual',
            ],
        );

        Deal::firstOrCreate(
            ['client_id' => $client->id, 'title' => 'Enterprise license renewal'],
            [
                'value' => 48000,
                'stage' => DealStage::Negotiation,
                'status' => DealStatus::Open,
                'owner_id' => $owner->id,
                'expected_close_date' => Carbon::today()->addMonth(),
            ],
        );
    }
}
