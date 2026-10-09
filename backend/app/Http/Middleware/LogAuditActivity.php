<?php

namespace App\Http\Middleware;

use App\Services\AuditLogger;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class LogAuditActivity
{
    private const SKIP_PREFIXES = [
        'audit-logs',
        'security',
        'integrations',
        'notifications',
        'health',
        'broadcasting',
        'auth',
    ];

    private const MODULE_MAP = [
        'requests' => 'requests',
        'payrolls' => 'payroll',
        'jobs' => 'jobs',
        'applications' => 'applications',
        'employees' => 'employees',
        'documents' => 'documents',
        'events' => 'events',
        'trainings' => 'training',
        'evaluations' => 'evaluations',
        'skills' => 'skills',
        'projects' => 'projects',
        'tasks' => 'tasks',
        'tickets' => 'tickets',
        'inventory' => 'inventory',
        'conversations' => 'chat',
        'messages' => 'chat',
        'attendances' => 'attendance',
        'leaves' => 'leaves',
        'expenses' => 'finance',
        'budgets' => 'finance',
        'accounting' => 'finance',
        'crm' => 'crm',
        'helpdesk' => 'helpdesk',
        'recruitment' => 'recruitment',
        'security' => 'security',
        'users' => 'users',
        'auth' => 'auth',
    ];

    public function __construct(
        private AuditLogger $auditLogger,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (! $this->shouldLog($request, $response)) {
            return $response;
        }

        $user = $request->user('api');
        $segment = $this->firstSegment($request);
        $module = self::MODULE_MAP[$segment] ?? $segment;
        $action = $this->resolveAction($request);
        $description = $this->buildDescription($request, $action, $module);

        $this->auditLogger->log($user, $action, $module, $description, $request);

        return $response;
    }

    private function shouldLog(Request $request, Response $response): bool
    {
        if ($response->getStatusCode() < 200 || $response->getStatusCode() >= 300) {
            return false;
        }

        if (in_array($request->method(), ['GET', 'HEAD', 'OPTIONS'], true)) {
            return false;
        }

        $path = trim($request->path(), '/');
        if (str_starts_with($path, 'api/')) {
            $path = substr($path, 4);
        }

        foreach (self::SKIP_PREFIXES as $prefix) {
            if (str_starts_with($path, $prefix)) {
                return false;
            }
        }

        return true;
    }

    private function firstSegment(Request $request): string
    {
        $path = trim($request->path(), '/');
        if (str_starts_with($path, 'api/')) {
            $path = substr($path, 4);
        }

        return explode('/', $path)[0] ?? 'system';
    }

    private function resolveAction(Request $request): string
    {
        return match ($request->method()) {
            'POST' => 'create',
            'PUT', 'PATCH' => 'update',
            'DELETE' => 'delete',
            default => strtolower($request->method()),
        };
    }

    private function buildDescription(Request $request, string $action, string $module): string
    {
        $uri = $request->path();

        return ucfirst($action).' in '.$module.' ('.$request->method().' '.$uri.')';
    }
}
