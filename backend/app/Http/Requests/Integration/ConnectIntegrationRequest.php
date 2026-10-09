<?php

namespace App\Http\Requests\Integration;

use App\Enums\IntegrationService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ConnectIntegrationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'service_name' => ['required', Rule::enum(IntegrationService::class)],
            'api_key' => ['nullable', 'string', 'max:4096'],
            'webhook_url' => ['nullable', 'url', 'max:2048'],
            'status' => ['nullable', Rule::in(['active', 'inactive'])],
            'settings' => ['nullable', 'array'],
        ];
    }
}
