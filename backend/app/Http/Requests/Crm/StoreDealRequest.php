<?php

namespace App\Http\Requests\Crm;

use App\Enums\DealStage;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDealRequest extends FormRequest
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
            'client_id' => ['required', 'integer', 'exists:crm_clients,id'],
            'title' => ['required', 'string', 'max:255'],
            'value' => ['nullable', 'numeric', 'min:0'],
            'stage' => ['nullable', 'string', Rule::in(DealStage::values())],
            'expected_close_date' => ['nullable', 'date'],
        ];
    }
}
