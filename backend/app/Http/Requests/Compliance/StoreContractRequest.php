<?php

namespace App\Http\Requests\Compliance;

use Illuminate\Foundation\Http\FormRequest;

class StoreContractRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'employee_id' => ['required', 'integer', 'exists:users,id'],
            'expires_at' => ['nullable', 'date', 'after_or_equal:today'],
            'file' => ['required', 'file', 'max:15360', 'mimes:pdf'],
        ];
    }
}
