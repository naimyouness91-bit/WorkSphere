<?php

namespace App\Http\Requests\Performance;

use Illuminate\Foundation\Http\FormRequest;

class StoreFeedback360Request extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'employee_id' => ['required', 'integer', 'exists:users,id'],
            'feedback_text' => ['required', 'string', 'max:5000'],
            'rating' => ['required', 'numeric', 'min:1', 'max:5'],
            'feedback_date' => ['nullable', 'date'],
            'is_anonymous' => ['nullable', 'boolean'],
        ];
    }
}
