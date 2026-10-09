<?php

namespace Database\Seeders;

use App\Enums\AlertSeverity;
use App\Enums\AlertStatus;
use App\Enums\UserRole;
use App\Models\RolePermission;
use App\Models\SecurityAlert;
use Illuminate\Database\Seeder;

class SecuritySeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            [UserRole::Manager, 'view', 'employees'],
            [UserRole::Manager, 'manage', 'payroll'],
            [UserRole::Manager, 'manage', 'finance'],
            [UserRole::Manager, 'manage', 'inventory'],
            [UserRole::Manager, 'manage', 'crm'],
            [UserRole::Manager, 'view', 'reports'],
            [UserRole::Employee, 'view', 'documents'],
            [UserRole::Employee, 'view', 'training'],
            [UserRole::Employee, 'create', 'requests'],
            [UserRole::Employee, 'create', 'expenses'],
        ];

        foreach ($defaults as [$role, $permission, $module]) {
            RolePermission::firstOrCreate([
                'role' => $role,
                'permission' => $permission,
                'module' => $module,
            ]);
        }

        if (SecurityAlert::count() === 0) {
            SecurityAlert::create([
                'title' => 'Sample: Review access policies',
                'description' => 'Periodic reminder to review role permissions and audit log retention.',
                'severity' => AlertSeverity::Low,
                'status' => AlertStatus::Open,
                'source_type' => 'policy_review',
            ]);
        }
    }
}
