<?php

return [
    'provider' => env('AI_PROVIDER', 'openai'), // openai, anthropic

    'openai' => [
        'api_key' => env('OPENAI_API_KEY', ''),
        'base_url' => env('OPENAI_BASE_URL', 'https://api.openai.com/v1'),
        'model' => env('OPENAI_MODEL', 'gpt-4o-mini'),
    ],

    'anthropic' => [
        'api_key' => env('ANTHROPIC_API_KEY', ''),
        'model' => env('ANTHROPIC_MODEL', 'claude-3-5-haiku-20241022'),
    ],

    'enabled' => env('AI_ENABLED', true),

    'max_history' => (int) env('AI_MAX_HISTORY', 10),
];
