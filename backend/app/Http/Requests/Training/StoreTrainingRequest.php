<?php

namespace App\Http\Requests\Training;

use App\Enums\TrainingStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTrainingRequest extends FormRequest
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
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'trainer_id' => ['required', 'integer', 'exists:users,id'],
            'status' => ['sometimes', 'string', Rule::in(array_column(TrainingStatus::cases(), 'value'))],
            'assignee_ids' => ['sometimes', 'array'],
            'assignee_ids.*' => ['integer', 'exists:users,id'],
        ];
    }
}
