<?php

namespace App\Http\Requests\Compliance;

use Illuminate\Foundation\Http\FormRequest;

class StorePolicyRequest extends FormRequest
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
            'code' => ['nullable', 'string', 'max:80', 'regex:/^[a-z0-9\-_]+$/'],
            'effective_date' => ['required', 'date'],
            'file' => ['required', 'file', 'max:15360', 'mimes:pdf,doc,docx'],
        ];
    }
}
