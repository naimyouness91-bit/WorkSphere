<?php

namespace App\Services;

use App\Enums\RequestStatus;
use App\Enums\TrainingStatus;
use App\Enums\UserRole;
use App\Models\AssistantInteraction;
use App\Models\Evaluation;
use App\Models\InternalRequest;
use App\Models\Payroll;
use App\Models\Project;
use App\Models\Training;
use App\Models\User;
use App\Services\Ai\AiClientService;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class AssistantService
{
    public function __construct(
        private AiClientService $ai,
    ) {}

    public function suggestionsTodayCount(User $user): int
    {
        return AssistantInteraction::query()
            ->where('user_id', $user->id)
            ->where('interaction_type', 'suggest')
            ->whereDate('created_at', Carbon::today())
            ->count();
    }

    /**
     * @return array{greeting: string, suggestions: array<int, array<string, mixed>>, ai_suggestions_today: int}
     */
    public function suggest(User $user): array
    {
        $context = $this->buildContext($user);
        $ruleBased = $this->buildRuleBasedSuggestions($user, $context);

        $systemPrompt = $this->systemPrompt($user, $context);
        $summaryPrompt = 'Summarize the top 3 workplace recommendations in 2 sentences for '.$user->name.' ('.$user->role->value.').';

        $aiSummary = $this->ai->chat(
            [['role' => 'user', 'content' => $summaryPrompt]],
            $systemPrompt,
        );

        if ($this->ai->isConfigured()) {
            $enhanced = $this->tryEnhanceSuggestionsWithAi($user, $context, $ruleBased, $systemPrompt);
            if ($enhanced !== []) {
                $ruleBased = $enhanced;
            }
        }

        AssistantInteraction::create([
            'user_id' => $user->id,
            'interaction_type' => 'suggest',
            'user_message' => null,
            'assistant_response' => $aiSummary,
            'suggestions' => $ruleBased,
            'meta' => ['context_snapshot' => $context],
        ]);

        return [
            'greeting' => $this->greeting($user),
            'suggestions' => $ruleBased,
            'ai_suggestions_today' => $this->suggestionsTodayCount($user),
            'summary' => $aiSummary,
        ];
    }

    /**
     * @return array{greeting: string, reply: string, history: array<int, array<string, string>>}
     */
    public function chat(User $user, string $message): array
    {
        $context = $this->buildContext($user);
        $history = $this->recentChatHistory($user);

        $messages = $history;
        $messages[] = ['role' => 'user', 'content' => $message];

        $reply = $this->ai->chat($messages, $this->systemPrompt($user, $context));

        AssistantInteraction::create([
            'user_id' => $user->id,
            'interaction_type' => 'chat',
            'user_message' => $message,
            'assistant_response' => $reply,
            'suggestions' => null,
            'meta' => ['role' => $user->role->value],
        ]);

        $history[] = ['role' => 'user', 'content' => $message];
        $history[] = ['role' => 'assistant', 'content' => $reply];

        return [
            'greeting' => $this->greeting($user),
            'reply' => $reply,
            'history' => $history,
            'ai_suggestions_today' => $this->suggestionsTodayCount($user),
        ];
    }

    public function history(User $user, int $limit = 20): Collection
    {
        return AssistantInteraction::query()
            ->where('user_id', $user->id)
            ->latest()
            ->limit($limit)
            ->get();
    }

    private function greeting(User $user): string
    {
        return __('messages.assistant.greeting', [
            'name' => $user->name,
            'role' => ucfirst($user->role->value),
        ]);
    }

    private function systemPrompt(User $user, array $context): string
    {
        return implode("\n", [
            'You are WorkSphere AI Assistant, a helpful workplace copilot.',
            'User: '.$user->name.' (role: '.$user->role->value.').',
            'Be concise, professional, and actionable. Reference WorkSphere modules: Requests, Training, Payroll, Calendar, Documents, Reports.',
            'Context: '.json_encode($context),
        ]);
    }

    /**
     * @return array<int, array{role: string, content: string}>
     */
    private function recentChatHistory(User $user): array
    {
        $rows = AssistantInteraction::query()
            ->where('user_id', $user->id)
            ->where('interaction_type', 'chat')
            ->latest()
            ->limit(config('ai.max_history'))
            ->get()
            ->reverse();

        $messages = [];
        foreach ($rows as $row) {
            if ($row->user_message) {
                $messages[] = ['role' => 'user', 'content' => $row->user_message];
            }
            $messages[] = ['role' => 'assistant', 'content' => $row->assistant_response];
        }

        return $messages;
    }

    private function buildContext(User $user): array
    {
        $isEmployee = $user->role === UserRole::Employee;

        $pendingRequests = InternalRequest::query()
            ->when($isEmployee, fn ($q) => $q->where('employee_id', $user->id))
            ->where('status', RequestStatus::Pending)
            ->count();

        $upcomingTrainings = Training::query()
            ->where('status', TrainingStatus::Scheduled)
            ->where('start_date', '>=', Carbon::now())
            ->when($isEmployee, function ($q) use ($user) {
                $q->where(function ($inner) use ($user) {
                    $inner->where('trainer_id', $user->id)
                        ->orWhereHas('assignees', fn ($aq) => $aq->where('users.id', $user->id));
                });
            })
            ->count();

        $activeProjects = Project::where('status', \App\Enums\ProjectStatus::Active)->count();

        $context = [
            'pending_requests' => $pendingRequests,
            'upcoming_trainings' => $upcomingTrainings,
            'active_projects' => $activeProjects,
        ];

        if (! $isEmployee) {
            $context['recent_payrolls'] = Payroll::query()->where('pay_date', '>=', Carbon::now()->subDays(30))->count();
            $context['pending_approvals'] = InternalRequest::where('status', RequestStatus::Pending)->count();
        } else {
            $context['my_evaluations'] = Evaluation::where('employee_id', $user->id)->count();
        }

        return $context;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function buildRuleBasedSuggestions(User $user, array $context): array
    {
        $suggestions = [];

        if ($context['pending_requests'] > 0 && in_array($user->role, [UserRole::Admin, UserRole::Manager], true)) {
            $suggestions[] = [
                'id' => 'req-pending',
                'category' => 'request',
                'title' => __('messages.assistant.suggestions.request_title'),
                'description' => __('messages.assistant.suggestions.request_pending', ['count' => $context['pending_requests']]),
                'action_type' => 'approve_request',
                'action_path' => '/requests',
                'priority' => 'high',
            ];
        }

        if ($user->role === UserRole::Employee && $context['pending_requests'] === 0) {
            $suggestions[] = [
                'id' => 'req-new',
                'category' => 'request',
                'title' => __('messages.assistant.suggestions.request_title'),
                'description' => __('messages.assistant.suggestions.request_create'),
                'action_type' => 'create_request',
                'action_path' => '/requests',
                'priority' => 'medium',
            ];
        }

        if ($context['upcoming_trainings'] > 0) {
            $suggestions[] = [
                'id' => 'training-upcoming',
                'category' => 'training',
                'title' => __('messages.assistant.suggestions.training_title'),
                'description' => __('messages.assistant.suggestions.training_upcoming', ['count' => $context['upcoming_trainings']]),
                'action_type' => 'schedule_training',
                'action_path' => '/training',
                'priority' => 'medium',
            ];
        } elseif (in_array($user->role, [UserRole::Admin, UserRole::Manager], true)) {
            $roleLabel = $user->role->value;
            $suggestions[] = [
                'id' => 'training-role',
                'category' => 'training',
                'title' => __('messages.assistant.suggestions.training_title'),
                'description' => __('messages.assistant.suggestions.training_role', ['role' => $roleLabel]),
                'action_type' => 'schedule_training',
                'action_path' => '/training',
                'priority' => 'low',
            ];
        }

        if (in_array($user->role, [UserRole::Admin, UserRole::Manager], true)) {
            if (($context['recent_payrolls'] ?? 0) > 0) {
                $suggestions[] = [
                    'id' => 'payroll-review',
                    'category' => 'payroll',
                    'title' => __('messages.assistant.suggestions.payroll_title'),
                    'description' => __('messages.assistant.suggestions.payroll_review'),
                    'action_type' => 'view_payroll',
                    'action_path' => '/payroll',
                    'priority' => 'medium',
                ];
            }

            $suggestions[] = [
                'id' => 'analytics-insight',
                'category' => 'analytics',
                'title' => __('messages.assistant.suggestions.analytics_title'),
                'description' => __('messages.assistant.suggestions.analytics_insight', [
                    'projects' => $context['active_projects'],
                    'requests' => $context['pending_requests'],
                ]),
                'action_type' => 'view_reports',
                'action_path' => '/reports',
                'priority' => 'medium',
            ];
        }

        if ($user->role === UserRole::Employee && ($context['my_evaluations'] ?? 0) > 0) {
            $suggestions[] = [
                'id' => 'payroll-performance',
                'category' => 'payroll',
                'title' => __('messages.assistant.suggestions.payroll_title'),
                'description' => __('messages.assistant.suggestions.payroll_performance'),
                'action_type' => 'view_payroll',
                'action_path' => '/payroll',
                'priority' => 'low',
            ];
        }

        return array_slice($suggestions, 0, 6);
    }

    /**
     * @param  array<int, array<string, mixed>>  $existing
     * @return array<int, array<string, mixed>>
     */
    private function tryEnhanceSuggestionsWithAi(User $user, array $context, array $existing, string $systemPrompt): array
    {
        $prompt = 'Given this JSON context '.json_encode($context).' return ONLY a JSON array of up to 4 suggestions. Each item: category (request|training|payroll|analytics), title, description, action_type, action_path, priority (high|medium|low). User role: '.$user->role->value;

        $raw = $this->ai->chat([['role' => 'user', 'content' => $prompt]], $systemPrompt);

        if (preg_match('/\[[\s\S]*\]/', $raw, $m)) {
            $parsed = json_decode($m[0], true);
            if (is_array($parsed) && count($parsed) > 0) {
                return array_map(fn ($item, $i) => [
                    'id' => 'ai-'.$i,
                    'category' => $item['category'] ?? 'analytics',
                    'title' => $item['title'] ?? 'Suggestion',
                    'description' => $item['description'] ?? '',
                    'action_type' => $item['action_type'] ?? 'navigate',
                    'action_path' => $item['action_path'] ?? '/',
                    'priority' => $item['priority'] ?? 'medium',
                ], $parsed, array_keys($parsed));
            }
        }

        return [];
    }
}
