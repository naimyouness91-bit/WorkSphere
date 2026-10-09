<?php

namespace App\Http\Requests\Payroll;

use Illuminate\Foundation\Http\FormRequest;

class StorePayrollRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'employee_id' => ['required', 'integer', 'exists:employees,id'],
            'base_salary' => ['required', 'numeric', 'min:0', 'max:99999999.99'],
            'bonuses' => ['sometimes', 'numeric', 'min:0', 'max:99999999.99'],
            'deductions' => ['sometimes', 'numeric', 'min:0', 'max:99999999.99'],
            'pay_date' => ['required', 'date'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'bonuses' => $this->input('bonuses', 0),
            'deductions' => $this->input('deductions', 0),
        ]);
    }
}
