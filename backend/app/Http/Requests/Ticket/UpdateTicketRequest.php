<?php

namespace App\Http\Requests\Ticket;

use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['sometimes', 'string', Rule::in(array_column(TicketStatus::cases(), 'value'))],
            'priority' => ['sometimes', 'string', Rule::in(array_column(TicketPriority::cases(), 'value'))],
            'assigned_to' => ['nullable', 'integer', 'exists:users,id'],
        ];
    }
}
