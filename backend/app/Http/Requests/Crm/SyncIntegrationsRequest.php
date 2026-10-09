<?php

namespace App\Http\Requests\Crm;

use App\Enums\CrmInteractionType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SyncIntegrationsRequest extends FormRequest
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
            'source' => ['required', 'string', Rule::in(['email', 'calendar'])],
            'interactions' => ['required', 'array', 'min:1'],
            'interactions.*.external_id' => ['nullable', 'string', 'max:255'],
            'interactions.*.client_id' => ['nullable', 'integer', 'exists:crm_clients,id'],
            'interactions.*.partner_id' => ['nullable', 'integer', 'exists:crm_partners,id'],
            'interactions.*.type' => ['nullable', 'string', Rule::in(CrmInteractionType::values())],
            'interactions.*.notes' => ['nullable', 'string'],
            'interactions.*.subject' => ['nullable', 'string', 'max:500'],
            'interactions.*.occurred_at' => ['nullable', 'date'],
            'interactions.*.date' => ['nullable', 'date'],
        ];
    }
}
