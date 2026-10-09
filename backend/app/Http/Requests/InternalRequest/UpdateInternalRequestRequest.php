<?php

namespace App\Http\Requests\InternalRequest;

use App\Enums\RequestStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateInternalRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => [
                'required',
                'string',
                Rule::in([RequestStatus::Approved->value, RequestStatus::Rejected->value]),
            ],
        ];
    }
}
