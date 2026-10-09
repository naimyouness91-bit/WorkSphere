<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AppNotificationResource;
use App\Models\AppNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user('api');

        $notifications = AppNotification::query()
            ->where('user_id', $user->id)
            ->latest()
            ->limit(50)
            ->get();

        $unreadCount = AppNotification::query()
            ->where('user_id', $user->id)
            ->where('read_status', false)
            ->count();

        return response()->json([
            'data' => AppNotificationResource::collection($notifications),
            'unread_count' => $unreadCount,
        ]);
    }

    public function markAsRead(AppNotification $appNotification): JsonResponse
    {
        $user = auth('api')->user();

        if ($appNotification->user_id !== $user->id) {
            return response()->json(['message' => __('messages.common.forbidden')], 403);
        }

        $appNotification->update(['read_status' => true]);

        return response()->json([
            'message' => __('messages.notifications.marked_read'),
            'data' => new AppNotificationResource($appNotification->fresh()),
        ]);
    }

    public function markAllAsRead(): JsonResponse
    {
        $user = auth('api')->user();

        AppNotification::query()
            ->where('user_id', $user->id)
            ->where('read_status', false)
            ->update(['read_status' => true]);

        return response()->json([
            'message' => __('messages.notifications.all_marked_read'),
        ]);
    }
}
