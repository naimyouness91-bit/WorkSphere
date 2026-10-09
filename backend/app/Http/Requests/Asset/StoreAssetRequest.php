<?php

namespace App\Http\Requests\Asset;

use App\Enums\AssetStatus;
use App\Enums\AssetType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAssetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::in(AssetType::values())],
            'serial_number' => ['nullable', 'string', 'max:100', 'unique:assets,serial_number'],
            'purchase_date' => ['nullable', 'date'],
            'status' => ['nullable', Rule::in(AssetStatus::values())],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
