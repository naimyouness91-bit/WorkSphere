<?php

namespace App\Http\Controllers\Api;

use App\Enums\ActivityAction;
use App\Http\Controllers\Controller;
use App\Services\ActivityLogService;
use App\Http\Requests\Employee\StoreEmployeeRequest;
use App\Http\Requests\Employee\UpdateEmployeeRequest;
use App\Http\Resources\EmployeeResource;
use App\Models\Employee;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class EmployeeController extends Controller
{
    public function __construct(private ActivityLogService $activityLog) {}

    public function index(): AnonymousResourceCollection
    {
        $employees = Employee::query()
            ->orderBy('name')
            ->get();

        return EmployeeResource::collection($employees);
    }

    public function store(StoreEmployeeRequest $request): JsonResponse
    {
        $employee = Employee::create($request->validated());

        $user = $request->user('api');
        if ($user) {
            $this->activityLog->log(
                $user,
                ActivityAction::EmployeeCreated,
                __('messages.activity.employee_created', ['name' => $employee->name]),
                ['employee_id' => $employee->id],
            );
        }

        return response()->json([
            'message' => __('messages.employees.created'),
            'data' => new EmployeeResource($employee),
        ], 201);
    }

    public function update(UpdateEmployeeRequest $request, Employee $employee): JsonResponse
    {
        $employee->update($request->validated());

        return response()->json([
            'message' => __('messages.employees.updated'),
            'data' => new EmployeeResource($employee->fresh()),
        ]);
    }

    public function destroy(Employee $employee): JsonResponse
    {
        $employee->delete();

        return response()->json([
            'message' => __('messages.employees.deleted'),
        ]);
    }
}
