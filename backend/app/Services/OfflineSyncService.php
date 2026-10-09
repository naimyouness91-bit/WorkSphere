<?php

namespace App\Services;

use App\Enums\AttendanceStatus;
use App\Enums\RequestStatus;
use App\Enums\TaskStatus;
use App\Enums\UserRole;
use App\Http\Requests\InternalRequest\StoreInternalRequestRequest;
use App\Models\Asset;
use App\Models\AssetAssignment;
use App\Models\Attendance;
use App\Models\Employee;
use App\Models\InternalRequest;
use App\Models\Policy;
use App\Models\SyncLog;
use App\Models\Task;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Validator;

class OfflineSyncService
{
    public function __construct(
        private NotificationService $notifications,
    ) {}

    public function getOfflineData(User $user): array
    {
        $isEmployeeOnly = $user->role === UserRole::Employee;

        $employeesQuery = Employee::query()->orderBy('name');
        if ($isEmployeeOnly) {
            $employeesQuery->where('email', $user->email);
        }

        $tasksQuery = Task::query()
            ->with(['project:id,name', 'assignee:id,name'])
            ->orderBy('due_date');

        if ($isEmployeeOnly) {
            $tasksQuery->where('assigned_to', $user->id);
        }

        $assetsQuery = Asset::query()->orderBy('name');
        if ($isEmployeeOnly) {
            $assetIds = AssetAssignment::query()
                ->where('employee_id', $user->id)
                ->whereNull('return_date')
                ->pluck('asset_id');
            $assetsQuery->whereIn('id', $assetIds);
        }

        $requestsQuery = InternalRequest::query()
            ->with('employee:id,name')
            ->latest()
            ->limit(50);
        if ($isEmployeeOnly) {
            $requestsQuery->where('employee_id', $user->id);
        }

        $attendanceQuery = Attendance::query()
            ->orderByDesc('date')
            ->limit(30);
        if ($isEmployeeOnly) {
            $attendanceQuery->where('employee_id', $user->id);
        }

        return [
            'synced_at' => Carbon::now()->toIso8601String(),
            'employees' => $employeesQuery->limit(100)->get()->map(fn (Employee $e) => [
                'id' => $e->id,
                'name' => $e->name,
                'email' => $e->email,
                'department' => $e->department,
                'position' => $e->position,
                'updated_at' => $e->updated_at?->toIso8601String(),
            ]),
            'tasks' => $tasksQuery->limit(80)->get()->map(fn (Task $t) => [
                'id' => $t->id,
                'project_id' => $t->project_id,
                'project_name' => $t->project?->name,
                'title' => $t->title,
                'description' => $t->description,
                'status' => $t->status->value,
                'due_date' => $t->due_date?->format('Y-m-d'),
                'assigned_to' => $t->assigned_to,
                'assignee_name' => $t->assignee?->name,
                'updated_at' => $t->updated_at?->toIso8601String(),
            ]),
            'policies' => Policy::query()
                ->where('is_current', true)
                ->orderBy('title')
                ->limit(30)
                ->get()
                ->map(fn (Policy $p) => [
                    'id' => $p->id,
                    'code' => $p->code,
                    'title' => $p->title,
                    'version' => $p->version,
                    'effective_date' => $p->effective_date?->format('Y-m-d'),
                    'updated_at' => $p->updated_at?->toIso8601String(),
                ]),
            'assets' => $assetsQuery->limit(80)->get()->map(fn (Asset $a) => [
                'id' => $a->id,
                'name' => $a->name,
                'type' => $a->type->value,
                'serial_number' => $a->serial_number,
                'status' => $a->status->value,
                'updated_at' => $a->updated_at?->toIso8601String(),
            ]),
            'requests' => $requestsQuery->get()->map(fn (InternalRequest $r) => [
                'id' => $r->id,
                'title' => $r->title,
                'type' => $r->type->value,
                'status' => $r->status->value,
                'description' => $r->description,
                'updated_at' => $r->updated_at?->toIso8601String(),
            ]),
            'attendance' => $attendanceQuery->get()->map(fn (Attendance $a) => [
                'id' => $a->id,
                'employee_id' => $a->employee_id,
                'date' => $a->date?->format('Y-m-d'),
                'check_in_time' => $a->check_in_time?->toIso8601String(),
                'check_out_time' => $a->check_out_time?->toIso8601String(),
                'status' => $a->status->value,
                'updated_at' => $a->updated_at?->toIso8601String(),
            ]),
        ];
    }

    public function syncOfflineChanges(User $user, array $actions): array
    {
        $results = [];
        $applied = 0;
        $failed = 0;
        $conflicts = 0;

        foreach ($actions as $action) {
            $clientId = $action['client_id'] ?? null;
            $type = $action['type'];
            $payload = $action['payload'] ?? [];
            $clientUpdatedAt = isset($payload['updated_at'])
                ? Carbon::parse($payload['updated_at'])
                : null;

            try {
                $result = match ($type) {
                    'submit_request' => $this->applySubmitRequest($user, $payload, $clientId),
                    'update_task_status' => $this->applyTaskUpdate($user, $payload, $clientUpdatedAt),
                    'upsert_attendance' => $this->applyAttendanceUpsert($user, $payload, $clientUpdatedAt),
                    default => ['status' => 'failed', 'error' => 'Unknown action type'],
                };

                if ($result['status'] === 'ok') {
                    $applied++;
                    $this->log($user, 'sync_apply', 'success', $type, $clientId, $result);
                } elseif ($result['status'] === 'conflict') {
                    $conflicts++;
                    $this->log($user, 'sync_conflict', 'conflict', $type, $clientId, $result);
                } else {
                    $failed++;
                    $this->log($user, 'sync_apply', 'failed', $type, $clientId, $result);
                }

                $results[] = array_merge(['client_id' => $clientId, 'type' => $type], $result);
            } catch (\Throwable $e) {
                $failed++;
                $this->log($user, 'sync_apply', 'failed', $type, $clientId, [
                    'error' => $e->getMessage(),
                ]);
                $results[] = [
                    'client_id' => $clientId,
                    'type' => $type,
                    'status' => 'failed',
                    'error' => $e->getMessage(),
                ];
            }
        }

        $this->log($user, 'sync_batch', $failed > 0 ? 'partial' : 'success', 'batch_complete', null, [
            'applied' => $applied,
            'failed' => $failed,
            'conflicts' => $conflicts,
            'total' => count($actions),
        ]);

        return [
            'results' => $results,
            'summary' => [
                'applied' => $applied,
                'failed' => $failed,
                'conflicts' => $conflicts,
            ],
        ];
    }

    public function statsForDashboard(User $user): array
    {
        $lastSync = SyncLog::query()
            ->where('user_id', $user->id)
            ->where('action', 'sync_batch')
            ->whereIn('status', ['success', 'partial'])
            ->orderByDesc('occurred_at')
            ->first();

        return [
            'last_sync_at' => $lastSync?->occurred_at?->toIso8601String(),
            'pending_changes' => null,
        ];
    }

    private function applySubmitRequest(User $user, array $payload, ?string $clientId): array
    {
        $validator = Validator::make($payload, (new StoreInternalRequestRequest)->rules());
        if ($validator->fails()) {
            return ['status' => 'failed', 'errors' => $validator->errors()];
        }

        $internalRequest = InternalRequest::create([
            ...$validator->validated(),
            'status' => RequestStatus::Pending,
            'employee_id' => $user->id,
        ]);
        $this->notifications->notifyRequestCreated($internalRequest);

        return [
            'status' => 'ok',
            'server_id' => $internalRequest->id,
            'entity_type' => 'request',
        ];
    }

    private function applyTaskUpdate(User $user, array $payload, ?Carbon $clientUpdatedAt): array
    {
        $taskId = $payload['task_id'] ?? null;
        $status = $payload['status'] ?? null;

        if (! $taskId || ! $status) {
            return ['status' => 'failed', 'error' => 'Missing task_id or status'];
        }

        $task = Task::find($taskId);
        if (! $task) {
            return ['status' => 'failed', 'error' => 'Task not found'];
        }

        if ($user->role === UserRole::Employee && $task->assigned_to !== $user->id) {
            return ['status' => 'failed', 'error' => 'Forbidden'];
        }

        if ($clientUpdatedAt && $task->updated_at && $task->updated_at->gt($clientUpdatedAt)) {
            return [
                'status' => 'conflict',
                'resolution' => 'server_newer',
                'server' => [
                    'id' => $task->id,
                    'status' => $task->status->value,
                    'updated_at' => $task->updated_at->toIso8601String(),
                ],
            ];
        }

        $task->update(['status' => TaskStatus::from($status)]);

        return [
            'status' => 'ok',
            'server_id' => $task->id,
            'entity_type' => 'task',
            'updated_at' => $task->fresh()->updated_at?->toIso8601String(),
        ];
    }

    private function applyAttendanceUpsert(User $user, array $payload, ?Carbon $clientUpdatedAt): array
    {
        $date = $payload['date'] ?? Carbon::today()->toDateString();
        $employeeId = $user->role === UserRole::Employee
            ? $user->id
            : ($payload['employee_id'] ?? $user->id);

        $attendance = Attendance::query()
            ->where('employee_id', $employeeId)
            ->whereDate('date', $date)
            ->first();

        if ($attendance && $clientUpdatedAt && $attendance->updated_at?->gt($clientUpdatedAt)) {
            return [
                'status' => 'conflict',
                'resolution' => 'server_newer',
                'server' => [
                    'id' => $attendance->id,
                    'updated_at' => $attendance->updated_at->toIso8601String(),
                ],
            ];
        }

        $status = isset($payload['status'])
            ? AttendanceStatus::from($payload['status'])
            : AttendanceStatus::Present;

        if ($attendance) {
            $attendance->update([
                'check_in_time' => $payload['check_in_time'] ?? $attendance->check_in_time,
                'check_out_time' => $payload['check_out_time'] ?? $attendance->check_out_time,
                'status' => $status,
            ]);
            $attendance->recalculateWorkingMinutes();
            $attendance->save();
        } else {
            $attendance = Attendance::create([
                'employee_id' => $employeeId,
                'date' => $date,
                'check_in_time' => $payload['check_in_time'] ?? null,
                'check_out_time' => $payload['check_out_time'] ?? null,
                'status' => $status,
            ]);
            $attendance->recalculateWorkingMinutes();
            $attendance->save();
        }

        return [
            'status' => 'ok',
            'server_id' => $attendance->id,
            'entity_type' => 'attendance',
        ];
    }

    private function log(
        User $user,
        string $action,
        string $status,
        string $description,
        ?string $clientId = null,
        ?array $meta = null,
    ): void {
        SyncLog::create([
            'user_id' => $user->id,
            'action' => $action,
            'status' => $status,
            'description' => is_string($description) ? $description : json_encode($description),
            'client_id' => $clientId,
            'entity_type' => $meta['entity_type'] ?? null,
            'entity_id' => $meta['server_id'] ?? null,
            'meta' => $meta,
            'occurred_at' => Carbon::now(),
        ]);
    }
}
