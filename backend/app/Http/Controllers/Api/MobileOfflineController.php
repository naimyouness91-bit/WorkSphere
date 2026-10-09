<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SyncLog;
use App\Services\OfflineSyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MobileOfflineController extends Controller
{
    public function __construct(private OfflineSyncService $offline) {}

    public function getOfflineData(Request $request): JsonResponse
    {
        return response()->json([
            'message' => __('messages.mobile.offline_data_loaded'),
            'data' => $this->offline->getOfflineData($request->user('api')),
        ]);
    }

    public function syncOfflineChanges(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'actions' => ['required', 'array', 'max:50'],
            'actions.*.type' => ['required', 'string', 'in:submit_request,update_task_status,upsert_attendance'],
            'actions.*.payload' => ['required', 'array'],
            'actions.*.client_id' => ['nullable', 'string', 'max:64'],
        ]);

        $result = $this->offline->syncOfflineChanges(
            $request->user('api'),
            $validated['actions'],
        );

        return response()->json([
            'message' => __('messages.mobile.sync_complete'),
            'data' => $result,
        ]);
    }

    public function syncLogs(Request $request): JsonResponse
    {
        $user = $request->user('api');

        $logs = SyncLog::query()
            ->where('user_id', $user->id)
            ->orderByDesc('occurred_at')
            ->limit(30)
            ->get()
            ->map(fn (SyncLog $log) => [
                'id' => $log->id,
                'action' => $log->action,
                'status' => $log->status,
                'description' => $log->description,
                'client_id' => $log->client_id,
                'occurred_at' => $log->occurred_at?->toIso8601String(),
            ]);

        return response()->json(['data' => ['logs' => $logs]]);
    }
}
