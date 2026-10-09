<?php

namespace App\Http\Requests\Crm;

use App\Enums\CrmInteractionType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LogInteractionRequest extends FormRequest
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
            'client_id' => ['nullable', 'integer', 'exists:crm_clients,id', 'required_without:partner_id'],
            'partner_id' => ['nullable', 'integer', 'exists:crm_partners,id', 'required_without:client_id'],
            'type' => ['required', 'string', Rule::in(CrmInteractionType::values())],
            'notes' => ['nullable', 'string', 'max:5000'],
            'occurred_at' => ['nullable', 'date'],
        ];
    }
}
