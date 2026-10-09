<?php

namespace App\Http\Requests\Report;

use App\Enums\ReportScheduleFrequency;
use App\Enums\ReportType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreReportRequest extends FormRequest
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
            'type' => ['required', Rule::enum(ReportType::class)],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'department' => ['nullable', 'string', 'max:120'],
            'is_scheduled' => ['sometimes', 'boolean'],
            'schedule_frequency' => [
                'nullable',
                Rule::enum(ReportScheduleFrequency::class),
                Rule::requiredIf(fn () => $this->boolean('is_scheduled')),
            ],
        ];
    }
}
