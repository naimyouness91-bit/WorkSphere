<?php

namespace App\Http\Requests\Helpdesk;

use App\Enums\TicketCategory;
use App\Enums\TicketPriority;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:10000'],
            'category' => ['sometimes', 'string', Rule::in(array_column(TicketCategory::cases(), 'value'))],
            'support_category_id' => ['sometimes', 'nullable', 'integer', 'exists:support_categories,id'],
            'priority' => ['sometimes', 'string', Rule::in(array_column(TicketPriority::cases(), 'value'))],
        ];
    }
}
