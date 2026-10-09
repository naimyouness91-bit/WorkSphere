<?php

namespace App\Services;

use App\Models\DeviceToken;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FcmPushService
{
    private ?array $credentials = null;

    private ?string $accessToken = null;

    private ?int $tokenExpiresAt = null;

    public function isConfigured(): bool
    {
        $path = config('firebase.credentials');
        if ($path && is_readable($path)) {
            return true;
        }

        return (bool) config('firebase.server_key');
    }

    /**
     * @param  array<string, string>  $data
     */
    public function sendToUser(int $userId, string $title, string $body, array $data = []): void
    {
        $tokens = DeviceToken::query()
            ->where('user_id', $userId)
            ->pluck('token')
            ->all();

        if ($tokens === []) {
            return;
        }

        foreach ($tokens as $token) {
            $this->sendToToken($token, $title, $body, $data);
        }
    }

    /**
     * @param  array<string, string>  $data
     */
    public function sendToToken(string $token, string $title, string $body, array $data = []): void
    {
        if (! $this->isConfigured()) {
            Log::debug('FCM not configured; skipping push', ['title' => $title]);

            return;
        }

        $credentialsPath = config('firebase.credentials');
        if ($credentialsPath && is_readable($credentialsPath)) {
            $this->sendViaHttpV1($token, $title, $body, $data);

            return;
        }

        $this->sendViaLegacy($token, $title, $body, $data);
    }

    /**
     * @param  array<string, string>  $data
     */
    private function sendViaLegacy(string $token, string $title, string $body, array $data): void
    {
        $serverKey = config('firebase.server_key');
        if (! $serverKey) {
            return;
        }

        Http::withHeaders([
            'Authorization' => 'key='.$serverKey,
            'Content-Type' => 'application/json',
        ])->post('https://fcm.googleapis.com/fcm/send', [
            'to' => $token,
            'notification' => [
                'title' => $title,
                'body' => $body,
            ],
            'data' => $data,
        ]);
    }

    /**
     * @param  array<string, string>  $data
     */
    private function sendViaHttpV1(string $token, string $title, string $body, array $data): void
    {
        $credentials = $this->loadCredentials();
        if ($credentials === null) {
            return;
        }

        $accessToken = $this->getAccessToken($credentials);
        if ($accessToken === null) {
            return;
        }

        $projectId = $credentials['project_id'] ?? null;
        if (! $projectId) {
            return;
        }

        $payload = [
            'message' => [
                'token' => $token,
                'notification' => [
                    'title' => $title,
                    'body' => $body,
                ],
                'data' => array_map('strval', $data),
            ],
        ];

        Http::withToken($accessToken)
            ->post("https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send", $payload);
    }

    private function loadCredentials(): ?array
    {
        if ($this->credentials !== null) {
            return $this->credentials;
        }

        $path = config('firebase.credentials');
        if (! $path || ! is_readable($path)) {
            return null;
        }

        $json = json_decode(file_get_contents($path), true);
        $this->credentials = is_array($json) ? $json : null;

        return $this->credentials;
    }

    private function getAccessToken(array $credentials): ?string
    {
        if ($this->accessToken && $this->tokenExpiresAt && time() < $this->tokenExpiresAt - 60) {
            return $this->accessToken;
        }

        $jwt = $this->createJwt($credentials);
        if ($jwt === null) {
            return null;
        }

        $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion' => $jwt,
        ]);

        if (! $response->successful()) {
            Log::warning('FCM OAuth token request failed', ['body' => $response->body()]);

            return null;
        }

        $this->accessToken = $response->json('access_token');
        $this->tokenExpiresAt = time() + (int) ($response->json('expires_in') ?? 3600);

        return $this->accessToken;
    }

    private function createJwt(array $credentials): ?string
    {
        $clientEmail = $credentials['client_email'] ?? null;
        $privateKey = $credentials['private_key'] ?? null;
        if (! $clientEmail || ! $privateKey) {
            return null;
        }

        $now = time();
        $header = $this->base64UrlEncode(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
        $claim = $this->base64UrlEncode(json_encode([
            'iss' => $clientEmail,
            'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
            'aud' => 'https://oauth2.googleapis.com/token',
            'iat' => $now,
            'exp' => $now + 3600,
        ]));

        $unsigned = "{$header}.{$claim}";
        $signature = '';
        $key = openssl_pkey_get_private($privateKey);
        if ($key === false) {
            return null;
        }
        openssl_sign($unsigned, $signature, $key, OPENSSL_ALGO_SHA256);

        return $unsigned.'.'.$this->base64UrlEncode($signature);
    }

    private function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
}
