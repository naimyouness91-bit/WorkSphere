<?php

namespace App\Services\Ai;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiClientService
{
    public function isConfigured(): bool
    {
        if (! config('ai.enabled')) {
            return false;
        }

        return match (config('ai.provider')) {
            'anthropic' => (bool) config('ai.anthropic.api_key'),
            default => (bool) config('ai.openai.api_key'),
        };
    }

    /**
     * @param  array<int, array{role: string, content: string}>  $messages
     */
    public function chat(array $messages, string $systemPrompt): string
    {
        if (! $this->isConfigured()) {
            return $this->fallbackResponse($messages, $systemPrompt);
        }

        return match (config('ai.provider')) {
            'anthropic' => $this->chatAnthropic($messages, $systemPrompt),
            default => $this->chatOpenAi($messages, $systemPrompt),
        };
    }

    /**
     * @param  array<int, array{role: string, content: string}>  $messages
     */
    private function chatOpenAi(array $messages, string $systemPrompt): string
    {
        $payload = [
            ['role' => 'system', 'content' => $systemPrompt],
            ...$messages,
        ];

        $response = Http::withToken(config('ai.openai.api_key'))
            ->timeout(60)
            ->post(config('ai.openai.base_url').'/chat/completions', [
                'model' => config('ai.openai.model'),
                'messages' => $payload,
                'temperature' => 0.7,
                'max_tokens' => 1024,
            ]);

        if (! $response->successful()) {
            Log::warning('OpenAI API error', ['status' => $response->status(), 'body' => $response->body()]);

            return $this->fallbackResponse($messages, $systemPrompt);
        }

        return $response->json('choices.0.message.content') ?? $this->fallbackResponse($messages, $systemPrompt);
    }

    /**
     * @param  array<int, array{role: string, content: string}>  $messages
     */
    private function chatAnthropic(array $messages, string $systemPrompt): string
    {
        $response = Http::withHeaders([
            'x-api-key' => config('ai.anthropic.api_key'),
            'anthropic-version' => '2023-06-01',
            'content-type' => 'application/json',
        ])
            ->timeout(60)
            ->post('https://api.anthropic.com/v1/messages', [
                'model' => config('ai.anthropic.model'),
                'max_tokens' => 1024,
                'system' => $systemPrompt,
                'messages' => array_map(fn ($m) => [
                    'role' => $m['role'] === 'assistant' ? 'assistant' : 'user',
                    'content' => $m['content'],
                ], $messages),
            ]);

        if (! $response->successful()) {
            Log::warning('Anthropic API error', ['status' => $response->status()]);

            return $this->fallbackResponse($messages, $systemPrompt);
        }

        $content = $response->json('content');
        if (is_array($content) && isset($content[0]['text'])) {
            return $content[0]['text'];
        }

        return $this->fallbackResponse($messages, $systemPrompt);
    }

    /**
     * @param  array<int, array{role: string, content: string}>  $messages
     */
    private function fallbackResponse(array $messages, string $systemPrompt): string
    {
        $lastUser = '';
        foreach (array_reverse($messages) as $msg) {
            if ($msg['role'] === 'user') {
                $lastUser = $msg['content'];
                break;
            }
        }

        $lower = strtolower($lastUser);

        if (str_contains($lower, 'training') || str_contains($lower, 'learn')) {
            return 'Based on your profile, I recommend checking the Training module for upcoming sessions assigned to you. Managers can schedule role-specific workshops from the Training page.';
        }
        if (str_contains($lower, 'payroll') || str_contains($lower, 'salary')) {
            return 'Payroll updates are published in the Payroll module. If you are an employee, contact your manager for compensation questions. Managers can review payroll summaries and trends in Reports.';
        }
        if (str_contains($lower, 'request') || str_contains($lower, 'leave')) {
            return 'You can submit internal requests (leave, equipment, vehicle) from the Requests page. Pending items appear on your dashboard KPIs until approved.';
        }
        if (str_contains($lower, 'analytics') || str_contains($lower, 'report')) {
            return 'Analytics and KPIs are available on the home dashboard and in Reports for managers. Active projects and pending requests are good starting points for weekly reviews.';
        }

        return 'I am the WorkSphere AI Assistant. I can help with requests, training, payroll, and analytics. Ask a specific question or use the suggestion cards for recommended actions. Configure OPENAI_API_KEY in .env for full AI responses.';
    }
}
