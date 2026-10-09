<?php

namespace Database\Seeders;

use App\Enums\RequestStatus;
use App\Enums\RequestType;
use App\Models\InternalRequest;
use App\Models\User;
use Illuminate\Database\Seeder;

class InternalRequestSeeder extends Seeder
{
    public function run(): void
    {
        $employee = User::where('email', 'employee@worksphere.test')->first();
        $manager = User::where('email', 'manager@worksphere.test')->first();

        if (! $employee) {
            return;
        }

        InternalRequest::updateOrCreate(
            ['title' => 'Annual leave - July'],
            [
                'description' => 'Requesting two weeks off for family vacation.',
                'type' => RequestType::Leave,
                'status' => RequestStatus::Pending,
                'employee_id' => $employee->id,
                'approver_id' => null,
            ],
        );

        InternalRequest::updateOrCreate(
            ['title' => 'Company vehicle for client visit'],
            [
                'description' => 'Need a vehicle for onsite client meeting next Friday.',
                'type' => RequestType::Vehicle,
                'status' => RequestStatus::Approved,
                'employee_id' => $employee->id,
                'approver_id' => $manager?->id,
            ],
        );
    }
}
