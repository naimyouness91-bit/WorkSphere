<?php

namespace App\Http\Requests\Skill;

use App\Enums\SkillLevel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSkillRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'employee_id' => ['required', 'integer', 'exists:users,id'],
            'level' => ['required', 'string', Rule::in(array_column(SkillLevel::cases(), 'value'))],
        ];
    }
}
