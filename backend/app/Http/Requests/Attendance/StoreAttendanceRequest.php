<?php

namespace App\Http\Requests\Attendance;

use App\Enums\AttendanceStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'employee_id' => ['sometimes', 'integer', 'exists:users,id'],
            'date' => ['required', 'date'],
            'check_in_time' => ['nullable', 'date'],
            'check_out_time' => ['nullable', 'date', 'after:check_in_time'],
            'status' => ['sometimes', 'string', Rule::in(array_column(AttendanceStatus::cases(), 'value'))],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
