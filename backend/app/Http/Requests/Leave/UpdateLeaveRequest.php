<?php

namespace App\Http\Requests\Leave;

use App\Enums\LeaveStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateLeaveRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'string', Rule::in([LeaveStatus::Approved->value, LeaveStatus::Rejected->value])],
        ];
    }
}
