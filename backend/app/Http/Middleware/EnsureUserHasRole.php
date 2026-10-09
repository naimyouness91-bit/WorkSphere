<?php

namespace App\Http\Middleware;

use App\Services\SecurityService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    public function __construct(
        private SecurityService $security,
    ) {}

    /**
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user('api');

        if (! $user) {
            return response()->json(['message' => __('messages.roles.unauthorized')], 401);
        }

        if (! in_array($user->role->value, $roles, true)) {
            $this->security->logUnauthorizedAccess($user, $request, $roles);

            return response()->json([
                'message' => __('messages.roles.forbidden'),
                'required_roles' => $roles,
                'your_role' => $user->role->value,
            ], 403);
        }

        return $next($request);
    }
}
