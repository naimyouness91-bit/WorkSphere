<?php

namespace App\Http\Controllers\Api;

use App\Enums\ReportScheduleFrequency;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Report\StoreReportRequest;
use App\Http\Resources\ReportResource;
use App\Models\Report;
use App\Models\User;
use App\Services\Analytics\AdvancedAnalyticsService;
use App\Services\ReportingAnalyticsService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AnalyticsController extends Controller
{
    public function __construct(
        private AdvancedAnalyticsService $analytics,
        private ReportingAnalyticsService $reporting,
    ) {}

    public function overview(Request $request): JsonResponse
    {
        $user = $request->user('api');
        if (! $this->analytics->canAccess($user)) {
            return response()->json(['message' => __('messages.analytics.forbidden')], 403);
        }

        $filters = $this->reporting->resolveFilters($request->only([
            'module', 'department', 'date_from', 'date_to',
        ]));

        return response()->json([
            'data' => $this->analytics->overview($filters),
            'departments' => $this->reporting->departmentOptions(),
        ]);
    }

    public function insights(Request $request): JsonResponse
    {
        $user = $request->user('api');
        if (! $this->analytics->canAccess($user)) {
            return response()->json(['message' => __('messages.analytics.forbidden')], 403);
        }

        $insights = $this->analytics->activeInsights(
            $request->string('category')->toString() ?: null,
        );

        return response()->json(['data' => $insights]);
    }

    public function refreshInsights(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');
        if (! $this->analytics->canAccess($user)) {
            return response()->json(['message' => __('messages.analytics.forbidden')], 403);
        }

        $count = $this->analytics->generateInsights(true);

        return response()->json([
            'message' => __('messages.analytics.insights_refreshed', ['count' => $count]),
            'data' => ['created' => $count],
        ]);
    }

    public function reports(Request $request): AnonymousResourceCollection|JsonResponse
    {
        $user = $request->user('api');
        if (! $this->analytics->canAccess($user)) {
            return response()->json(['message' => __('messages.analytics.forbidden')], 403);
        }

        $query = Report::query()->with('generator')->latest('generated_at');

        if ($request->filled('type')) {
            $query->where('type', $request->string('type'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('generated_at', '>=', $request->string('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('generated_at', '<=', $request->string('date_to'));
        }

        return ReportResource::collection($query->paginate(20));
    }

    public function generateReport(StoreReportRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('api');

        if (! $this->analytics->canAccess($user)) {
            return response()->json(['message' => __('messages.analytics.forbidden')], 403);
        }

        $validated = $request->validated();
        $module = $validated['type'] === 'hr' ? 'attendance' : $validated['type'];

        $filters = $this->reporting->resolveFilters([
            'module' => $module,
            'department' => $validated['department'] ?? null,
            'date_from' => $validated['date_from'] ?? null,
            'date_to' => $validated['date_to'] ?? null,
        ]);

        if ($validated['type'] === 'hr') {
            $filters['module'] = 'all';
            $payload = $this->reporting->getStatistics(array_merge($filters, ['module' => 'all']));
            $payload['hr'] = [
                'attendance' => $payload['attendance'] ?? null,
                'requests' => $payload['requests'] ?? null,
            ];
        } else {
            $payload = $this->reporting->buildPayloadForType($module, $filters);
        }

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

        $this->analytics->audit(
            $user,
            'report_generated',
            'Generated report: '.$report->title,
            $report,
            ['type' => $report->type->value, 'filters' => $filters],
        );

        $report->load('generator');

        return response()->json([
            'message' => __('messages.reports.created'),
            'data' => new ReportResource($report),
        ], 201);
    }

    public function auditLogs(Request $request): JsonResponse
    {
        $user = $request->user('api');
        if (! $this->analytics->canAccess($user)) {
            return response()->json(['message' => __('messages.analytics.forbidden')], 403);
        }

        $logs = \App\Models\AnalyticsAuditLog::query()
            ->with(['user:id,name', 'report:id,title'])
            ->latest('occurred_at')
            ->limit(100)
            ->get();

        return response()->json(['data' => $logs]);
    }
}
