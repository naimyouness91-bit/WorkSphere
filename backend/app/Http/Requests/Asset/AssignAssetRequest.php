<?php

namespace App\Http\Requests\Asset;

use Illuminate\Foundation\Http\FormRequest;

class AssignAssetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'employee_id' => ['required', 'integer', 'exists:users,id'],
            'assigned_date' => ['nullable', 'date'],
            'expected_return_date' => ['nullable', 'date', 'after_or_equal:assigned_date'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
