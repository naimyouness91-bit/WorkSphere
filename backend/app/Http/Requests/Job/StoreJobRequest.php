<?php

namespace App\Http\Requests\Job;

use App\Enums\JobStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreJobRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:20000'],
            'requirements' => ['nullable', 'string', 'max:20000'],
            'department' => ['required', 'string', 'max:100'],
            'location' => ['required', 'string', 'max:255'],
            'status' => ['sometimes', 'string', Rule::in(array_column(JobStatus::cases(), 'value'))],
        ];
    }
}
