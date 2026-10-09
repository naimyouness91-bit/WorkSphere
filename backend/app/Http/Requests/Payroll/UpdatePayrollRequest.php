<?php

namespace App\Http\Requests\Payroll;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePayrollRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'employee_id' => ['sometimes', 'integer', 'exists:employees,id'],
            'base_salary' => ['sometimes', 'numeric', 'min:0', 'max:99999999.99'],
            'bonuses' => ['sometimes', 'numeric', 'min:0', 'max:99999999.99'],
            'deductions' => ['sometimes', 'numeric', 'min:0', 'max:99999999.99'],
            'pay_date' => ['sometimes', 'date'],
        ];
    }
}
