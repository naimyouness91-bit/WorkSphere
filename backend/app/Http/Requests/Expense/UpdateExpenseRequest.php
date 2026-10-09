<?php

namespace App\Http\Requests\Expense;

use App\Enums\ExpenseCategory;
use App\Enums\ExpenseStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'amount' => ['sometimes', 'numeric', 'min:0.01', 'max:99999999.99'],
            'category' => ['sometimes', Rule::enum(ExpenseCategory::class)],
            'date' => ['sometimes', 'date'],
            'status' => ['sometimes', Rule::enum(ExpenseStatus::class)],
        ];
    }
}
