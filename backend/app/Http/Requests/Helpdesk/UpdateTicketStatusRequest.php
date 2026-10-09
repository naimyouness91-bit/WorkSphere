<?php

namespace App\Http\Requests\Helpdesk;

use App\Enums\TicketStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTicketStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'string', Rule::in(array_column(TicketStatus::cases(), 'value'))],
            'comment' => ['sometimes', 'nullable', 'string', 'max:5000'],
        ];
    }
}
