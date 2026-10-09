<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HelpdeskTicketResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $sla = $this->sla;

        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'category' => $this->category->value,
            'support_category_id' => $this->support_category_id,
            'status' => $this->status->value,
            'priority' => $this->priority->value,
            'employee_id' => $this->employee_id,
            'assigned_to' => $this->assigned_to,
            'conversation_id' => $this->conversation_id,
            'resolved_at' => $this->resolved_at?->toIso8601String(),
            'first_response_at' => $this->first_response_at?->toIso8601String(),
            'escalated_at' => $this->escalated_at?->toIso8601String(),
            'sla_escalated' => (bool) $this->sla_escalated,
            'employee' => $this->whenLoaded('employee', fn () => [
                'id' => $this->employee->id,
                'name' => $this->employee->name,
                'email' => $this->employee->email,
            ]),
            'assignee' => $this->whenLoaded('assignee', fn () => $this->assignee ? [
                'id' => $this->assignee->id,
                'name' => $this->assignee->name,
                'email' => $this->assignee->email,
            ] : null),
            'support_category' => $this->whenLoaded('supportCategory', fn () => $this->supportCategory ? [
                'id' => $this->supportCategory->id,
                'name' => $this->supportCategory->name,
                'slug' => $this->supportCategory->slug,
                'description' => $this->supportCategory->description,
            ] : null),
            'sla' => $sla ? [
                'status' => $sla->status->value,
                'response_due_at' => $sla->response_due_at->toIso8601String(),
                'resolution_due_at' => $sla->resolution_due_at->toIso8601String(),
                'responded_at' => $sla->responded_at?->toIso8601String(),
                'resolved_at' => $sla->resolved_at?->toIso8601String(),
                'response_seconds_remaining' => now()->lt($sla->response_due_at)
                    ? (int) now()->diffInSeconds($sla->response_due_at)
                    : 0,
                'resolution_seconds_remaining' => now()->lt($sla->resolution_due_at)
                    ? (int) now()->diffInSeconds($sla->resolution_due_at)
                    : 0,
            ] : null,
            'updates' => $this->whenLoaded('updates', fn () => $this->updates->map(fn ($u) => [
                'id' => $u->id,
                'type' => $u->type->value,
                'message' => $u->message,
                'meta' => $u->meta,
                'user' => $u->user ? ['id' => $u->user->id, 'name' => $u->user->name] : null,
                'created_at' => $u->created_at?->toIso8601String(),
            ])),
            'conversation' => $this->whenLoaded('conversation', fn () => $this->conversation ? [
                'id' => $this->conversation->id,
                'name' => $this->conversation->name,
                'type' => $this->conversation->type->value,
            ] : null),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
