<?php

namespace App\Http\Controllers\Api;

use App\Enums\ReportScheduleFrequency;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Report\StoreReportRequest;
use App\Http\Resources\ReportResource;
use App\Models\Report;
use App\Models\User;
use App\Services\ReportingAnalyticsService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class ReportController extends Controller
{
    public function __construct(
        private ReportingAnalyticsService $reporting,
    ) {}

    public function statistics(Request $request): JsonResponse
    {
        if (! $this->canAccess($request->user('api'))) {
            return response()->json(['message' => __('messages.reports.forbidden')], 403);
        }

        $filters = $this->reporting->resolveFilters($request->only([
            'module', 'department', 'date_from', 'date_to',
        ]));

        return response()->json([
            'data' => $this->reporting->getStatistics($filters),
            'departments' => $this->reporting->departmentOptions(),
        ]);
    }

    public function drillDown(Request $request): JsonResponse
    {
        if (! $this->canAccess($request->user('api'))) {
            return response()->json(['message' => __('messages.reports.forbidden')], 403);
        }

        $validated = $request->validate([
            'module' => ['required', 'string', 'max:30'],
            'segment' => ['required', 'string', 'max:60'],
            'department' => ['nullable', 'string', 'max:120'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date'],
        ]);

        $filters = $this->reporting->resolveFilters($validated);

        return response()->json([
            'data' => $this->reporting->drillDown(
                $validated['module'],
                $validated['segment'],
                $filters,
            ),
        ]);
    }

    public function index(Request $request): AnonymousResourceCollection|JsonResponse
    {
        if (! $this->canAccess($request->user('api'))) {
            return response()->json(['message' => __('messages.reports.forbidden')], 403);
        }

        $query = Report::query()
            ->with('generator')
            ->latest('generated_at');

        if ($request->filled('type')) {
            $query->where('type', $request->string('type'));
        }

        return ReportResource::collection($query->paginate(20));
    }

    public function store(StoreReportRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        if (! $this->canAccess($user)) {
            return response()->json(['message' => __('messages.reports.forbidden')], 403);
        }

        $validated = $request->validated();
        $filters = $this->reporting->resolveFilters([
            'module' => $validated['type'],
            'department' => $validated['department'] ?? null,
            'date_from' => $validated['date_from'] ?? null,
            'date_to' => $validated['date_to'] ?? null,
        ]);

        $payload = $this->reporting->buildPayloadForType($validated['type'], $filters);

        $isScheduled = (bool) ($validated['is_scheduled'] ?? false);
        $frequency = $validated['schedule_frequency'] ?? null;

        $report = Report::create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'type' => $validated['type'],
            'generated_by' => $user->id,
            'generated_at' => Carbon::now(),
            'date_from' => $filters['date_from'],
            'date_to' => $filters['date_to'],
            'department' => $filters['department'] ?? null,
            'payload' => $payload,
            'is_scheduled' => $isScheduled,
            'schedule_frequency' => $isScheduled && $frequency
                ? ReportScheduleFrequency::from($frequency)
                : null,
            'next_run_at' => $isScheduled && $frequency
                ? $this->reporting->computeNextRunAt($frequency)
                : null,
        ]);

        $report->load('generator');

        app(\App\Services\Analytics\AdvancedAnalyticsService::class)->audit(
            $user,
            'report_generated',
            'Generated report: '.$report->title,
            $report,
            ['type' => $report->type->value],
        );

        return response()->json([
            'message' => __('messages.reports.created'),
            'data' => new ReportResource($report),
        ], 201);
    }

    public function show(Report $report): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        if (! $this->canAccess($user)) {
            return response()->json(['message' => __('messages.reports.forbidden')], 403);
        }

        $report->load('generator');

        return response()->json([
            'data' => new ReportResource($report),
        ]);
    }

    public function updateSchedule(Request $request, Report $report): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        if (! $this->canAccess($user)) {
            return response()->json(['message' => __('messages.reports.forbidden')], 403);
        }

        $validated = $request->validate([
            'is_scheduled' => ['required', 'boolean'],
            'schedule_frequency' => [
                'nullable',
                'in:weekly,monthly',
                Rule::requiredIf(fn () => $request->boolean('is_scheduled')),
            ],
        ]);

        $isScheduled = $validated['is_scheduled'];
        $frequency = $validated['schedule_frequency'] ?? null;

        $report->update([
            'is_scheduled' => $isScheduled,
            'schedule_frequency' => $isScheduled && $frequency
                ? ReportScheduleFrequency::from($frequency)
                : null,
            'next_run_at' => $isScheduled && $frequency
                ? $this->reporting->computeNextRunAt($frequency)
                : null,
        ]);

        $report->load('generator');

        return response()->json([
            'message' => __('messages.reports.schedule_updated'),
            'data' => new ReportResource($report),
        ]);
    }

    private function canAccess(?User $user): bool
    {
        return $user !== null && $user->hasAnyRole([
            UserRole::Admin->value,
            UserRole::Manager->value,
        ]);
    }
}
