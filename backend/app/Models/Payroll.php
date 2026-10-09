<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payroll extends Model
{
    protected $fillable = [
        'employee_id',
        'base_salary',
        'bonuses',
        'deductions',
        'net_salary',
        'pay_date',
    ];

    protected function casts(): array
    {
        return [
            'base_salary' => 'decimal:2',
            'bonuses' => 'decimal:2',
            'deductions' => 'decimal:2',
            'net_salary' => 'decimal:2',
            'pay_date' => 'date',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (Payroll $payroll) {
            $payroll->net_salary = $payroll->calculateNetSalary();
        });
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function calculateNetSalary(): string
    {
        $base = (float) $this->base_salary;
        $bonuses = (float) ($this->bonuses ?? 0);
        $deductions = (float) ($this->deductions ?? 0);
        $net = max(0, $base + $bonuses - $deductions);

        return number_format($net, 2, '.', '');
    }
}
