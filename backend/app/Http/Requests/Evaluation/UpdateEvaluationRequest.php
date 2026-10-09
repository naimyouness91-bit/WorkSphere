<?php

namespace App\Http\Requests\Evaluation;

use App\Enums\EvaluationStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEvaluationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'employee_id' => ['sometimes', 'integer', 'exists:users,id'],
            'review_period' => ['sometimes', 'string', 'max:50'],
            'score' => ['sometimes', 'numeric', 'min:0', 'max:5'],
            'comments' => ['nullable', 'string', 'max:10000'],
            'status' => ['sometimes', 'string', Rule::in(array_column(EvaluationStatus::cases(), 'value'))],
        ];
    }
}
