<?php

namespace Database\Seeders;

use App\Models\Employee;
use Illuminate\Database\Seeder;

class EmployeeSeeder extends Seeder
{
    public function run(): void
    {
        $employees = [
            [
                'name' => 'Jane Cooper',
                'email' => 'jane.cooper@worksphere.test',
                'phone' => '+1 555-0101',
                'department' => 'Engineering',
                'position' => 'Senior Developer',
                'hire_date' => '2022-03-15',
            ],
            [
                'name' => 'Robert Fox',
                'email' => 'robert.fox@worksphere.test',
                'phone' => '+1 555-0102',
                'department' => 'Marketing',
                'position' => 'Marketing Manager',
                'hire_date' => '2021-08-01',
            ],
            [
                'name' => 'Esther Howard',
                'email' => 'esther.howard@worksphere.test',
                'phone' => '+1 555-0103',
                'department' => 'Human Resources',
                'position' => 'HR Specialist',
                'hire_date' => '2023-01-10',
            ],
        ];

        foreach ($employees as $data) {
            Employee::updateOrCreate(
                ['email' => $data['email']],
                $data,
            );
        }
    }
}
