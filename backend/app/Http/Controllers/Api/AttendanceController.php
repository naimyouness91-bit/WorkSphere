<?php

namespace App\Http\Controllers\Api;

use App\Enums\AttendanceStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Attendance\StoreAttendanceRequest;
use App\Http\Requests\Attendance\UpdateAttendanceRequest;
use App\Http\Resources\AttendanceResource;
use App\Models\Attendance;
use App\Models\User;
use App\Services\AttendanceAnalyticsService;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AttendanceController extends Controller
{
    public function __construct(private AttendanceAnalyticsService $analytics) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        /** @var User $user */
        $user = $request->user('api');

        $query = Attendance::query()
            ->with('employee')
            ->orderByDesc('date');

        if ($this->isEmployeeOnly($user)) {
            $query->where('employee_id', $user->id);
        }

        $this->applyFilters($query, $request, $user);

        return AttendanceResource::collection($query->get());
    }

    public function store(StoreAttendanceRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        if (! $this->canManage($user)) {
            return response()->json(['message' => __('messages.attendance.forbidden')], 403);
        }

        $validated = $request->validated();
        $attendance = Attendance::create([
            ...$validated,
            'employee_id' => $validated['employee_id'] ?? $user->id,
            'status' => $validated['status'] ?? AttendanceStatus::Present,
        ]);
        $attendance->recalculateWorkingMinutes();
        $attendance->save();
        $attendance->load('employee');

        return response()->json([
            'message' => __('messages.attendance.created'),
            'data' => new AttendanceResource($attendance),
        ], 201);
    }

    public function show(Attendance $attendance): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        if (! $this->canAccess($user, $attendance)) {
            return response()->json(['message' => __('messages.attendance.forbidden')], 403);
        }

        $attendance->load('employee');

        return response()->json(['data' => new AttendanceResource($attendance)]);
    }

    public function update(UpdateAttendanceRequest $request, Attendance $attendance): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        if (! $this->canManage($user)) {
            return response()->json(['message' => __('messages.attendance.forbidden')], 403);
        }

        $attendance->update($request->validated());
        $attendance->recalculateWorkingMinutes();
        $attendance->save();
        $attendance->load('employee');

        return response()->json([
            'message' => __('messages.attendance.updated'),
            'data' => new AttendanceResource($attendance),
        ]);
    }

    public function destroy(Attendance $attendance): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        if (! $this->canManage($user)) {
            return response()->json(['message' => __('messages.attendance.forbidden')], 403);
        }

        $attendance->delete();

        return response()->json(['message' => __('messages.attendance.deleted')]);
    }

    public function checkIn(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');
        $today = Carbon::today();
        $now = Carbon::now();

        $attendance = Attendance::firstOrNew([
            'employee_id' => $user->id,
            'date' => $today->toDateString(),
        ]);

        if ($attendance->check_in_time) {
            return response()->json(['message' => __('messages.attendance.already_checked_in')], 422);
        }

        $attendance->check_in_time = $now;
        $attendance->status = Attendance::determineStatusOnCheckIn($now);
        $attendance->save();
        $attendance->load('employee');

        return response()->json([
            'message' => __('messages.attendance.checked_in'),
            'data' => new AttendanceResource($attendance),
        ]);
    }

    public function checkOut(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');
        $today = Carbon::today()->toDateString();

        $attendance = Attendance::query()
            ->where('employee_id', $user->id)
            ->whereDate('date', $today)
            ->first();

        if (! $attendance || ! $attendance->check_in_time) {
            return response()->json(['message' => __('messages.attendance.check_in_first')], 422);
        }

        if ($attendance->check_out_time) {
            return response()->json(['message' => __('messages.attendance.already_checked_out')], 422);
        }

        $attendance->check_out_time = Carbon::now();
        $attendance->recalculateWorkingMinutes();
        $attendance->save();
        $attendance->load('employee');

        return response()->json([
            'message' => __('messages.attendance.checked_out'),
            'data' => new AttendanceResource($attendance),
        ]);
    }

    public function today(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');
        $employeeId = $this->canManage($user) && $request->filled('employee_id')
            ? $request->integer('employee_id')
            : $user->id;

        $attendance = Attendance::query()
            ->with('employee')
            ->where('employee_id', $employeeId)
            ->whereDate('date', Carbon::today())
            ->first();

        return response()->json([
            'data' => $attendance ? new AttendanceResource($attendance) : null,
        ]);
    }

    public function report(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        if (! $this->canManage($user) && $request->filled('employee_id') && $request->integer('employee_id') !== $user->id) {
            return response()->json(['message' => __('messages.attendance.forbidden')], 403);
        }

        $year = (int) $request->input('year', now()->year);
        $month = (int) $request->input('month', now()->month);
        $employeeId = $request->filled('employee_id') ? $request->integer('employee_id') : null;

        if ($this->isEmployeeOnly($user)) {
            $employeeId = $user->id;
        }

        $report = $this->analytics->monthlyReport($year, $month, $employeeId);

        return response()->json([
            'data' => [
                'year' => $report['year'],
                'month' => $report['month'],
                'workdays' => $report['workdays'],
                'by_employee' => $report['by_employee'],
                'records' => AttendanceResource::collection($report['records']),
            ],
        ]);
    }

    public function summary(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');
        $employeeId = $request->filled('employee_id') ? $request->integer('employee_id') : $user->id;

        if ($this->isEmployeeOnly($user) && $employeeId !== $user->id) {
            return response()->json(['message' => __('messages.attendance.forbidden')], 403);
        }

        $hours = $this->analytics->employeeTotalHours(
            $employeeId,
            $request->input('date_from'),
            $request->input('date_to'),
        );

        return response()->json([
            'data' => [
                'employee_id' => $employeeId,
                'total_working_hours' => $hours,
            ],
        ]);
    }

    private function applyFilters(Builder $query, Request $request, User $user): void
    {
        if ($request->filled('employee_id') && $this->canManage($user)) {
            $query->where('employee_id', $request->integer('employee_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('date', '>=', $request->string('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('date', '<=', $request->string('date_to'));
        }

        if ($request->filled('date')) {
            $query->whereDate('date', $request->string('date'));
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

    private function canAccess(User $user, Attendance $attendance): bool
    {
        return $this->canManage($user) || $attendance->employee_id === $user->id;
    }
}
