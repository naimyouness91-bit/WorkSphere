<?php

namespace App\Http\Requests\Integration;

use App\Enums\IntegrationService;
use App\Enums\IntegrationStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreIntegrationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'service_name' => [
                'required',
                Rule::enum(IntegrationService::class),
                Rule::unique('integrations', 'service_name'),
            ],
            'api_key' => ['nullable', 'string', 'max:4096'],
            'webhook_url' => ['nullable', 'url', 'max:2048'],
            'status' => ['sometimes', Rule::enum(IntegrationStatus::class)],
            'settings' => ['nullable', 'array'],
        ];
    }
}
