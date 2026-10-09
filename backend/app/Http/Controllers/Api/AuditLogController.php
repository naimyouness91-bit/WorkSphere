<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Resources\AuditLogResource;
use App\Models\AuditLog;
use App\Models\User;
use App\Services\AuditAnalyticsService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AuditLogController extends Controller
{
    public function __construct(
        private AuditAnalyticsService $auditAnalytics,
    ) {}

    public function index(Request $request): AnonymousResourceCollection|JsonResponse
    {
        if (! $this->isAdmin($request->user('api'))) {
            return response()->json(['message' => __('messages.audit.forbidden')], 403);
        }

        $query = AuditLog::query()
            ->with('user')
            ->latest('logged_at');

        $this->applyFilters($query, $request);

        return AuditLogResource::collection($query->paginate(50));
    }

    public function show(AuditLog $auditLog): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        if (! $this->isAdmin($user)) {
            return response()->json(['message' => __('messages.audit.forbidden')], 403);
        }

        $auditLog->load('user');

        return response()->json([
            'data' => new AuditLogResource($auditLog),
        ]);
    }

    public function alerts(Request $request): JsonResponse
    {
        if (! $this->isAdmin($request->user('api'))) {
            return response()->json(['message' => __('messages.audit.forbidden')], 403);
        }

        return response()->json([
            'data' => $this->auditAnalytics->securityAlerts(),
        ]);
    }

    public function summary(Request $request): JsonResponse
    {
        if (! $this->isAdmin($request->user('api'))) {
            return response()->json(['message' => __('messages.audit.forbidden')], 403);
        }

        return response()->json([
            'data' => [
                'kpis' => $this->auditAnalytics->dashboardKpis(),
                'alerts' => $this->auditAnalytics->securityAlerts(),
            ],
        ]);
    }

    private function applyFilters(Builder $query, Request $request): void
    {
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->integer('user_id'));
        }

        if ($request->filled('module')) {
            $query->where('module', $request->string('module'));
        }

        if ($request->filled('action')) {
            $query->where('action', $request->string('action'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('logged_at', '>=', $request->string('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('logged_at', '<=', $request->string('date_to'));
        }

        if ($request->filled('search')) {
            $term = '%'.$request->string('search').'%';
            $query->where(function (Builder $q) use ($term) {
                $q->where('description', 'like', $term)
                    ->orWhere('ip_address', 'like', $term)
                    ->orWhere('action', 'like', $term)
                    ->orWhere('module', 'like', $term)
                    ->orWhereHas('user', fn (Builder $uq) => $uq
                        ->where('name', 'like', $term)
                        ->orWhere('email', 'like', $term));
            });
        }
    }

    private function isAdmin(?User $user): bool
    {
        return $user !== null && $user->role === UserRole::Admin;
    }
}
