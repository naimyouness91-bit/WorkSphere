<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Enums\WorkflowDomain;
use App\Models\SystemSetting;
use App\Models\Workflow;
use Illuminate\Database\Seeder;

class CustomizationSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            ['key' => 'app_name', 'value' => 'WorkSphere', 'category' => 'general'],
            ['key' => 'support_email', 'value' => 'support@worksphere.local', 'category' => 'general'],
            ['key' => 'default_locale', 'value' => 'en', 'category' => 'general'],
            ['key' => 'maintenance_mode', 'value' => 'false', 'category' => 'system'],
            ['key' => 'approval_timeout_days', 'value' => '7', 'category' => 'workflows'],
            ['key' => 'brand_primary', 'value' => '#4f46e5', 'category' => 'appearance'],
            ['key' => 'brand_secondary', 'value' => '#6366f1', 'category' => 'appearance'],
        ];

        foreach ($defaults as $row) {
            SystemSetting::query()->updateOrCreate(
                ['key' => $row['key']],
                ['value' => $row['value'], 'category' => $row['category']],
            );
        }

        Workflow::query()->updateOrCreate(
            ['title' => 'HR Leave Approval'],
            [
                'description' => 'Standard leave request chain for HR.',
                'domain' => WorkflowDomain::Hr->value,
                'assigned_roles' => [UserRole::Admin->value, UserRole::Manager->value, UserRole::Employee->value],
                'is_active' => true,
                'steps' => [
                    ['order' => 1, 'name' => 'Employee submission', 'approver_role' => UserRole::Employee->value],
                    ['order' => 2, 'name' => 'HR manager review', 'approver_role' => UserRole::Manager->value],
                    ['order' => 3, 'name' => 'HR admin sign-off', 'approver_role' => UserRole::Admin->value],
                ],
            ],
        );

        Workflow::query()->updateOrCreate(
            ['title' => 'Finance Expense Approval'],
            [
                'description' => 'Expense and budget approval for Finance.',
                'domain' => WorkflowDomain::Finance->value,
                'assigned_roles' => [UserRole::Admin->value, UserRole::Manager->value],
                'is_active' => true,
                'steps' => [
                    ['order' => 1, 'name' => 'Submit expense', 'approver_role' => UserRole::Employee->value],
                    ['order' => 2, 'name' => 'Finance manager', 'approver_role' => UserRole::Manager->value],
                    ['order' => 3, 'name' => 'Finance director', 'approver_role' => UserRole::Admin->value],
                ],
            ],
        );
    }
}
