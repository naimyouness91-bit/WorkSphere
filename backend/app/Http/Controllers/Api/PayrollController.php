<?php

namespace App\Http\Controllers\Api;

use App\Enums\ActivityAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Payroll\StorePayrollRequest;
use App\Http\Requests\Payroll\UpdatePayrollRequest;
use App\Http\Resources\PayrollResource;
use App\Models\Payroll;
use App\Services\ActivityLogService;
use App\Services\NotificationService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PayrollController extends Controller
{
    public function __construct(
        private ActivityLogService $activityLog,
        private NotificationService $notifications,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Payroll::query()
            ->with('employee')
            ->orderByDesc('pay_date')
            ->orderByDesc('id');

        $this->applyFilters($query, $request);

        return PayrollResource::collection($query->get());
    }

    public function summary(Request $request): JsonResponse
    {
        $query = Payroll::query();
        $this->applyFilters($query, $request);

        $totalCost = (float) (clone $query)->sum('net_salary');
        $count = (clone $query)->count();
        $averageSalary = $count > 0
            ? round((float) (clone $query)->avg('net_salary'), 2)
            : 0;

        return response()->json([
            'data' => [
                'total_payroll_cost' => round($totalCost, 2),
                'average_salary' => $averageSalary,
                'record_count' => $count,
            ],
        ]);
    }

    public function store(StorePayrollRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $payroll = Payroll::create([
            'employee_id' => $validated['employee_id'],
            'base_salary' => $validated['base_salary'],
            'bonuses' => $validated['bonuses'] ?? 0,
            'deductions' => $validated['deductions'] ?? 0,
            'pay_date' => $validated['pay_date'],
        ]);

        $payroll->load('employee');

        $user = $request->user('api');
        if ($user && $payroll->employee) {
            $this->activityLog->log(
                $user,
                ActivityAction::PayrollCreated,
                __('messages.activity.payroll_created', ['name' => $payroll->employee->name]),
                ['payroll_id' => $payroll->id, 'employee_id' => $payroll->employee_id],
            );
        }

        $this->notifications->notifyPayrollPublished($payroll);

        return response()->json([
            'message' => __('messages.payrolls.created'),
            'data' => new PayrollResource($payroll),
        ], 201);
    }

    public function show(Payroll $payroll): JsonResponse
    {
        $payroll->load('employee');

        return response()->json([
            'data' => new PayrollResource($payroll),
        ]);
    }

    public function update(UpdatePayrollRequest $request, Payroll $payroll): JsonResponse
    {
        $payroll->update($request->validated());
        $payroll->load('employee');

        $user = $request->user('api');
        if ($user && $payroll->employee) {
            $this->activityLog->log(
                $user,
                ActivityAction::PayrollUpdated,
                __('messages.activity.payroll_updated', ['name' => $payroll->employee->name]),
                ['payroll_id' => $payroll->id, 'employee_id' => $payroll->employee_id],
            );
        }

        $this->notifications->notifyPayrollPublished($payroll->fresh());

        return response()->json([
            'message' => __('messages.payrolls.updated'),
            'data' => new PayrollResource($payroll),
        ]);
    }

    private function applyFilters(Builder $query, Request $request): void
    {
        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->integer('employee_id'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('pay_date', '>=', $request->string('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('pay_date', '<=', $request->string('date_to'));
        }
    }
}
