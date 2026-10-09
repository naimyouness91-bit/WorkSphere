<?php

namespace App\Http\Requests\Crm;

use App\Enums\PartnerStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePartnerRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'organization' => ['required', 'string', 'max:255'],
            'contact_info' => ['nullable', 'string', 'max:2000'],
            'status' => ['nullable', 'string', Rule::in(PartnerStatus::values())],
        ];
    }
}
