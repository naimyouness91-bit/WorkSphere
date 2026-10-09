<?php

namespace App\Http\Requests\Integration;

use App\Enums\IntegrationService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SendIntegrationMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'service' => ['required', Rule::in([IntegrationService::Slack->value, IntegrationService::Teams->value])],
            'message' => ['required', 'string', 'max:4000'],
            'title' => ['nullable', 'string', 'max:200'],
        ];
    }
}
