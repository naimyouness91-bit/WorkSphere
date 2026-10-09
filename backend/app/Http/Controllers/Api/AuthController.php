<?php

namespace App\Http\Controllers\Api;

use App\Enums\Locale;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Requests\Auth\UpdateLocaleRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\NotificationService;
use App\Services\SecurityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    public function __construct(
        private AuditLogger $auditLogger,
    ) {}

    public function register(RegisterRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $locale = Locale::resolve(
            $validated['locale'] ?? null,
            $request->header('Accept-Language'),
        );

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => UserRole::Employee,
            'locale' => $locale,
        ]);

        $token = JWTAuth::fromUser($user);

        $this->auditLogger->log(
            $user,
            'create',
            'auth',
            'User registered: '.$user->email,
            $request,
        );

        return $this->authResponse($user, $token, __('messages.auth.register_success'), 201);
    }

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        Password::sendResetLink($request->only('email'));

        return response()->json([
            'message' => __('messages.auth.reset_link_sent'),
        ]);
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password): void {
                $user->forceFill([
                    'password' => $password,
                ])->save();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        }

        return response()->json([
            'message' => __('messages.auth.password_reset_success'),
        ]);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->only('email', 'password');

        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            $this->auditLogger->log(
                null,
                'login_failed',
                'auth',
                'Failed login for email: '.$credentials['email'],
                $request,
            );

            app(SecurityService::class)->createAlert(
                __('messages.security.alert_types.failed_logins_email'),
                __('messages.notifications.security_login_failed', ['email' => $credentials['email']]),
                \App\Enums\AlertSeverity::High,
                'login_failed',
                ['fingerprint' => md5('login_failed|'.$credentials['email'].'|'.now()->format('Y-m-d H')), 'email' => $credentials['email']],
            );

            app(NotificationService::class)->notifySecurityAlertToAdmins(
                __('messages.notifications.security_login_failed', ['email' => $credentials['email']]),
            );

            throw ValidationException::withMessages([
                'email' => [__('messages.auth.invalid_credentials')],
            ]);
        }

        $token = JWTAuth::fromUser($user);

        $this->auditLogger->log(
            $user,
            'login',
            'auth',
            'User logged in: '.$user->email,
            $request,
        );

        return $this->authResponse($user, $token, __('messages.auth.login_success'));
    }

    public function me(): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        return response()->json([
            'user' => new UserResource($user),
        ]);
    }

    public function updateLocale(UpdateLocaleRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();
        $user->locale = Locale::from($request->validated('locale'));
        $user->save();

        return response()->json([
            'message' => __('messages.auth.locale_updated'),
            'user' => new UserResource($user->fresh()),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        /** @var User|null $user */
        $user = auth('api')->user();

        if ($user) {
            $this->auditLogger->log(
                $user,
                'logout',
                'auth',
                'User logged out: '.$user->email,
                $request,
            );
        }

        auth('api')->logout();

        return response()->json([
            'message' => __('messages.auth.logout_success'),
        ]);
    }

    public function refresh(): JsonResponse
    {
        $token = auth('api')->refresh();

        return response()->json([
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => config('jwt.ttl') * 60,
        ]);
    }

    public function createSanctumToken(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token_name' => ['required', 'string', 'max:255'],
        ]);

        /** @var User $user */
        $user = auth('api')->user();
        $token = $user->createToken($validated['token_name']);

        return response()->json([
            'message' => __('messages.auth.sanctum_created'),
            'sanctum_token' => $token->plainTextToken,
        ]);
    }

    private function authResponse(User $user, string $token, string $message, int $status = 200): JsonResponse
    {
        return response()->json([
            'message' => $message,
            'user' => new UserResource($user),
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => config('jwt.ttl') * 60,
        ], $status);
    }
}
