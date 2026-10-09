<?php

namespace App\Http\Requests\Evaluation;

use App\Enums\EvaluationStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEvaluationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'employee_id' => ['required', 'integer', 'exists:users,id'],
            'review_period' => ['required', 'string', 'max:50'],
            'score' => ['required', 'numeric', 'min:0', 'max:5'],
            'comments' => ['nullable', 'string', 'max:10000'],
            'status' => ['sometimes', 'string', Rule::in(array_column(EvaluationStatus::cases(), 'value'))],
        ];
    }
}
