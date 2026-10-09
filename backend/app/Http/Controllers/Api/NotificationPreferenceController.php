<?php

namespace App\Http\Controllers\Api;

use App\Enums\NotificationCategory;
use App\Http\Controllers\Controller;
use App\Models\NotificationPreference;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationPreferenceController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user('api');
        $prefs = NotificationPreference::defaultsForUser($user->id);

        return response()->json([
            'data' => $this->format($prefs),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email_enabled' => ['sometimes', 'boolean'],
            'push_enabled' => ['sometimes', 'boolean'],
            'in_app_enabled' => ['sometimes', 'boolean'],
            'category_push' => ['sometimes', 'nullable', 'array'],
            'category_push.*' => ['string', 'in:'.implode(',', NotificationCategory::values())],
            'category_email' => ['sometimes', 'nullable', 'array'],
            'category_email.*' => ['string', 'in:'.implode(',', NotificationCategory::values())],
        ]);

        $user = $request->user('api');
        $prefs = NotificationPreference::defaultsForUser($user->id);
        $prefs->update($validated);

        return response()->json([
            'message' => __('messages.mobile.preferences_updated'),
            'data' => $this->format($prefs->fresh()),
        ]);
    }

    private function format(NotificationPreference $prefs): array
    {
        return [
            'email_enabled' => $prefs->email_enabled,
            'push_enabled' => $prefs->push_enabled,
            'in_app_enabled' => $prefs->in_app_enabled,
            'category_push' => $prefs->category_push ?? NotificationCategory::values(),
            'category_email' => $prefs->category_email ?? NotificationCategory::values(),
            'available_categories' => NotificationCategory::values(),
        ];
    }
}
