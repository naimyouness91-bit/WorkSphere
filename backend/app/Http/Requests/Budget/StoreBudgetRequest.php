<?php

namespace App\Http\Requests\Budget;

use App\Enums\BudgetPeriod;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBudgetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'department' => ['required', 'string', 'max:120'],
            'allocated_amount' => ['required', 'numeric', 'min:0', 'max:99999999.99'],
            'period' => ['required', Rule::enum(BudgetPeriod::class)],
            'period_year' => ['required', 'integer', 'min:2000', 'max:2100'],
            'period_month' => [
                'nullable',
                'integer',
                'min:1',
                'max:12',
                Rule::requiredIf(fn () => $this->input('period') === BudgetPeriod::Monthly->value),
            ],
        ];
    }
}
