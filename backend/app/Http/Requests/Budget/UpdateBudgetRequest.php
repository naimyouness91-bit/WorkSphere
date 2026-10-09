<?php

namespace App\Http\Requests\Budget;

use App\Enums\BudgetPeriod;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBudgetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'department' => ['sometimes', 'string', 'max:120'],
            'allocated_amount' => ['sometimes', 'numeric', 'min:0', 'max:99999999.99'],
            'period' => ['sometimes', Rule::enum(BudgetPeriod::class)],
            'period_year' => ['sometimes', 'integer', 'min:2000', 'max:2100'],
            'period_month' => ['nullable', 'integer', 'min:1', 'max:12'],
        ];
    }
}
