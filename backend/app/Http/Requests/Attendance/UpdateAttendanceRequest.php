<?php

namespace App\Http\Requests\Attendance;

use App\Enums\AttendanceStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'check_in_time' => ['nullable', 'date'],
            'check_out_time' => ['nullable', 'date'],
            'status' => ['sometimes', 'string', Rule::in(array_column(AttendanceStatus::cases(), 'value'))],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
