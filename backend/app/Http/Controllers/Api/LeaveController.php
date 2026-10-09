<?php

namespace App\Http\Controllers\Api;

use App\Enums\LeaveStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Leave\StoreLeaveRequest;
use App\Http\Requests\Leave\UpdateLeaveRequest;
use App\Http\Resources\LeaveResource;
use App\Models\Leave;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class LeaveController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        /** @var User $user */
        $user = $request->user('api');

        $query = Leave::query()
            ->with(['employee', 'approver'])
            ->latest('start_date');

        if ($this->isEmployeeOnly($user)) {
            $query->where('employee_id', $user->id);
        }

        $this->applyFilters($query, $request);

        return LeaveResource::collection($query->get());
    }

    public function store(StoreLeaveRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        $leave = Leave::create([
            ...$request->validated(),
            'employee_id' => $user->id,
            'status' => LeaveStatus::Pending,
        ]);

        $leave->load(['employee', 'approver']);

        return response()->json([
            'message' => __('messages.leaves.submitted'),
            'data' => new LeaveResource($leave),
        ], 201);
    }

    public function show(Leave $leave): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        if (! $this->canAccess($user, $leave)) {
            return response()->json(['message' => __('messages.leaves.forbidden')], 403);
        }

        $leave->load(['employee', 'approver']);

        return response()->json(['data' => new LeaveResource($leave)]);
    }

    public function update(UpdateLeaveRequest $request, Leave $leave): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        if (! $this->canManage($user)) {
            return response()->json(['message' => __('messages.leaves.forbidden')], 403);
        }

        if ($leave->status !== LeaveStatus::Pending) {
            return response()->json(['message' => __('messages.leaves.not_pending')], 422);
        }

        $leave->update([
            'status' => $request->validated('status'),
            'approver_id' => $user->id,
        ]);

        $leave->load(['employee', 'approver']);

        $message = $leave->status === LeaveStatus::Approved
            ? __('messages.leaves.approved')
            : __('messages.leaves.rejected');

        return response()->json([
            'message' => $message,
            'data' => new LeaveResource($leave),
        ]);
    }

    public function destroy(Leave $leave): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        if (! $leave->isOwnedBy($user) || $leave->status !== LeaveStatus::Pending) {
            if (! $this->canManage($user)) {
                return response()->json(['message' => __('messages.leaves.forbidden')], 403);
            }
        }

        if ($leave->status !== LeaveStatus::Pending) {
            return response()->json(['message' => __('messages.leaves.not_pending')], 422);
        }

        $leave->delete();

        return response()->json(['message' => __('messages.leaves.deleted')]);
    }

    public function calendar(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        $start = $request->input('start', now()->startOfMonth()->toDateString());
        $end = $request->input('end', now()->endOfMonth()->toDateString());

        $attendanceQuery = \App\Models\Attendance::query()
            ->with('employee')
            ->whereBetween('date', [$start, $end]);

        $leaveQuery = Leave::query()
            ->with('employee')
            ->where('status', LeaveStatus::Approved)
            ->where(function (Builder $q) use ($start, $end) {
                $q->whereBetween('start_date', [$start, $end])
                    ->orWhereBetween('end_date', [$start, $end])
                    ->orWhere(function (Builder $inner) use ($start, $end) {
                        $inner->where('start_date', '<=', $start)->where('end_date', '>=', $end);
                    });
            });

        if ($this->isEmployeeOnly($user)) {
            $attendanceQuery->where('employee_id', $user->id);
            $leaveQuery->where('employee_id', $user->id);
        } elseif ($request->filled('employee_id')) {
            $attendanceQuery->where('employee_id', $request->integer('employee_id'));
            $leaveQuery->where('employee_id', $request->integer('employee_id'));
        }

        $events = [];

        foreach ($attendanceQuery->get() as $record) {
            $events[] = [
                'id' => 'attendance-'.$record->id,
                'title' => ($record->employee?->name ?? 'Employee').' · '.$record->status->value,
                'start' => $record->date->format('Y-m-d'),
                'allDay' => true,
                'type' => 'attendance',
                'status' => $record->status->value,
                'color' => match ($record->status->value) {
                    'late' => '#f59e0b',
                    'absent' => '#ef4444',
                    default => '#10b981',
                },
            ];
        }

        foreach ($leaveQuery->get() as $leave) {
            $events[] = [
                'id' => 'leave-'.$leave->id,
                'title' => ($leave->employee?->name ?? 'Employee').' · '.$leave->leave_type->value,
                'start' => $leave->start_date->format('Y-m-d'),
                'end' => $leave->end_date->copy()->addDay()->format('Y-m-d'),
                'allDay' => true,
                'type' => 'leave',
                'status' => $leave->status->value,
                'color' => '#6366f1',
            ];
        }

        return response()->json(['data' => $events]);
    }

    private function applyFilters(Builder $query, Request $request): void
    {
        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('leave_type')) {
            $query->where('leave_type', $request->string('leave_type'));
        }

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->integer('employee_id'));
        }
    }

    private function isEmployeeOnly(User $user): bool
    {
        return $user->role === UserRole::Employee;
    }

    private function canManage(User $user): bool
    {
        return $user->hasAnyRole([UserRole::Admin->value, UserRole::Manager->value]);
    }

    private function canAccess(User $user, Leave $leave): bool
    {
        return $this->canManage($user) || $leave->isOwnedBy($user);
    }
}
