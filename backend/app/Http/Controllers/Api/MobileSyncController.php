<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\OfflineSyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** @deprecated Prefer MobileOfflineController::syncOfflineChanges; kept for Expo mobile client. */
class MobileSyncController extends Controller
{
    public function __construct(private OfflineSyncService $offline) {}

    public function sync(Request $request): JsonResponse
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
}
