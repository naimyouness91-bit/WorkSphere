<?php

namespace App\Http\Requests\Crm;

use App\Enums\DealStage;
use App\Enums\DealStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDealStatusRequest extends FormRequest
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
            'stage' => ['nullable', 'string', Rule::in(DealStage::values())],
            'status' => ['nullable', 'string', Rule::in(DealStatus::values())],
        ];
    }
}
