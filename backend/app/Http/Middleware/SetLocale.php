<?php

namespace App\Http\Middleware;

use App\Enums\Locale;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        $userLocale = null;

        if ($user = $request->user('api')) {
            $raw = $user->locale ?? null;
            $userLocale = $raw instanceof Locale ? $raw->value : $raw;
        }

        $locale = Locale::resolve(
            $request->header('X-Locale') ?? $userLocale,
            $request->header('Accept-Language'),
        );

        App::setLocale($locale->value);

        return $next($request);
    }
}
