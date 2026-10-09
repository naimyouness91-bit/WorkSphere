<?php

namespace App\Http\Requests\Recruitment;

use App\Enums\JobStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreJobPostingRequest extends FormRequest
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
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'requirements' => ['nullable', 'string'],
            'department' => ['required', 'string', 'max:120'],
            'location' => ['nullable', 'string', 'max:120'],
            'status' => ['nullable', 'string', Rule::in([JobStatus::Open->value, JobStatus::Closed->value])],
        ];
    }
}
