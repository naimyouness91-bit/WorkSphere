<?php

namespace App\Http\Requests\Performance;

use App\Enums\GoalStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreGoalRequest extends FormRequest
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
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'target_date' => ['required', 'date'],
            'status' => ['nullable', 'string', Rule::in(GoalStatus::values())],
            'progress' => ['nullable', 'integer', 'min:0', 'max:100'],
        ];
    }
}
