<?php

namespace App\Services;

use App\Enums\NotificationCategory;
use App\Enums\NotificationType;
use App\Enums\UserRole;
use App\Models\NotificationPreference;
use App\Events\UserNotificationSent;
use App\Models\AppNotification;
use App\Models\Employee;
use App\Models\Event;
use App\Models\InternalRequest;
use App\Models\Payroll;
use App\Models\Training;
use App\Models\User;
use App\Models\Task;
use App\Models\Milestone;
use Illuminate\Support\Facades\Mail;

class NotificationService
{
    public function __construct(
        private FcmPushService $fcm,
    ) {}

    public function notifyUser(
        int $userId,
        string $message,
        NotificationType $type,
        ?string $title = null,
        NotificationCategory $category = NotificationCategory::System,
    ): ?AppNotification {
        $prefs = NotificationPreference::defaultsForUser($userId);

        if (! $prefs->allowsInApp($category->value)) {
            if ($prefs->allowsPush($category->value)) {
                $this->sendPush($userId, $title ?? 'WorkSphere', $message, $category);
            }

            return null;
        }

        $notification = AppNotification::create([
            'user_id' => $userId,
            'title' => $title ?? $this->defaultTitle($category),
            'message' => $message,
            'type' => $type,
            'category' => $category,
            'read_status' => false,
        ]);

        broadcast(new UserNotificationSent($notification));

        if ($prefs->allowsPush($category->value)) {
            $this->sendPush($userId, $notification->title, $message, $category);
        }

        if ($prefs->email_enabled && $this->emailAllowedForCategory($prefs, $category->value)) {
            $this->sendEmail($userId, $notification->title, $message);
        }

        return $notification;
    }

    public function notifyAdminsAndManagers(
        string $message,
        NotificationType $type = NotificationType::Info,
        ?string $title = null,
        NotificationCategory $category = NotificationCategory::System,
    ): void {
        User::query()
            ->whereIn('role', [UserRole::Admin, UserRole::Manager])
            ->pluck('id')
            ->each(fn (int $userId) => $this->notifyUser($userId, $message, $type, $title, $category));
    }

    public function notifyRequestCreated(InternalRequest $request): void
    {
        $employeeName = $request->employee?->name ?? 'An employee';
        $typeLabel = $request->type->value;

        $message = __('messages.notifications.request_created_body', [
            'name' => $employeeName,
            'type' => $typeLabel,
            'title' => $request->title,
        ]);

        $this->notifyAdminsAndManagers(
            $message,
            NotificationType::Info,
            __('messages.notifications.request_created_title'),
            NotificationCategory::Request,
        );
    }

    public function notifyRequestStatusChanged(InternalRequest $request): void
    {
        $type = $request->status->value === 'approved'
            ? NotificationType::Success
            : NotificationType::Error;

        $key = $request->status->value === 'approved'
            ? 'messages.notifications.request_approved_body'
            : 'messages.notifications.request_rejected_body';

        $titleKey = $request->status->value === 'approved'
            ? 'messages.notifications.request_approved_title'
            : 'messages.notifications.request_rejected_title';

        $this->notifyUser(
            $request->employee_id,
            __($key, ['title' => $request->title]),
            $type,
            __($titleKey),
            NotificationCategory::Request,
        );
    }

    public function notifyPayrollPublished(Payroll $payroll): void
    {
        $employee = $payroll->employee;
        if (! $employee) {
            return;
        }

        $user = User::query()->where('email', $employee->email)->first();
        if (! $user) {
            return;
        }

        $message = __('messages.notifications.payroll_published_body', [
            'date' => $payroll->pay_date?->format('Y-m-d') ?? '',
            'amount' => number_format((float) $payroll->net_salary, 2),
        ]);

        $this->notifyUser(
            $user->id,
            $message,
            NotificationType::Success,
            __('messages.notifications.payroll_published_title'),
            NotificationCategory::Payroll,
        );

        app(\App\Services\Integrations\IntegrationBridgeService::class)->notifyPayrollPublished(
            $employee->name,
            number_format((float) $payroll->net_salary, 2),
            $payroll->pay_date?->format('Y-m-d') ?? '',
        );
    }

    public function notifyTrainingScheduled(Training $training, ?array $assigneeIds = null): void
    {
        $ids = $assigneeIds ?? $training->assignees()->pluck('users.id')->all();
        $message = __('messages.notifications.training_scheduled_body', [
            'title' => $training->title,
            'date' => $training->start_date?->format('Y-m-d') ?? '',
        ]);
        $title = __('messages.notifications.training_scheduled_title');

        foreach ($ids as $userId) {
            if ((int) $userId === (int) $training->trainer_id) {
                continue;
            }
            $this->notifyUser(
                (int) $userId,
                $message,
                NotificationType::Info,
                $title,
                NotificationCategory::Training,
            );
        }
    }

    public function notifySystemAlert(int $userId, string $title, string $message): void
    {
        $this->notifyUser(
            $userId,
            $message,
            NotificationType::Error,
            $title,
            NotificationCategory::System,
        );
    }

    public function notifySecurityAlertToAdmins(string $message): void
    {
        $this->notifyAdminsAndManagers(
            $message,
            NotificationType::Error,
            __('messages.notifications.security_alert_title'),
            NotificationCategory::System,
        );
    }

    public function notifyEventCreated(Event $event): void
    {
        $employeeName = $event->employee?->name ?? 'An employee';
        $typeLabel = $event->type->value;

        $this->notifyUser(
            $event->employee_id,
            __('messages.notifications.event_created_employee', [
                'title' => $event->title,
            ]),
            NotificationType::Success,
            __('messages.notifications.event_created_title'),
            NotificationCategory::System,
        );

        $this->notifyAdminsAndManagers(
            __('messages.notifications.event_created_admin', [
                'name' => $employeeName,
                'type' => $typeLabel,
                'title' => $event->title,
            ]),
            NotificationType::Info,
            __('messages.notifications.event_created_title'),
            NotificationCategory::System,
        );
    }

    public function notifyEventUpdated(Event $event, User $actor): void
    {
        $messageKey = $event->status === \App\Enums\EventStatus::Canceled
            ? 'messages.notifications.event_canceled'
            : 'messages.notifications.event_updated';

        $payload = [
            'title' => $event->title,
            'actor' => $actor->name,
        ];

        if ($event->employee_id !== $actor->id) {
            $this->notifyUser(
                $event->employee_id,
                __($messageKey, $payload),
                NotificationType::Info,
                __('messages.notifications.event_updated_title'),
                NotificationCategory::System,
            );
        }

        if ($actor->role === UserRole::Employee) {
            $this->notifyAdminsAndManagers(
                __('messages.notifications.event_updated_admin', $payload),
                NotificationType::Info,
                __('messages.notifications.event_updated_title'),
                NotificationCategory::System,
            );
        }
    }

    public function resolveUserIdForEmployee(Employee $employee): ?int
    {
        return User::query()->where('email', $employee->email)->value('id');
    }

    private function sendPush(int $userId, string $title, string $message, NotificationCategory $category): void
    {
        $this->fcm->sendToUser($userId, $title, $message, [
            'category' => $category->value,
        ]);
    }

    private function sendEmail(int $userId, string $title, string $body): void
    {
        $user = User::find($userId);
        if (! $user?->email) {
            return;
        }

        try {
            Mail::raw($body, function ($mail) use ($user, $title) {
                $mail->to($user->email)->subject($title);
            });
        } catch (\Throwable) {
            // Mail may be unconfigured in local dev
        }
    }

    private function emailAllowedForCategory(NotificationPreference $prefs, string $category): bool
    {
        if (! $prefs->email_enabled) {
            return false;
        }

        $allowed = $prefs->category_email;
        if ($allowed === null || $allowed === []) {
            return true;
        }

        return in_array($category, $allowed, true);
    }

    public function notifyPolicyPublished(\App\Models\Policy $policy): void
    {
        $message = __('messages.notifications.policy_published_body', [
            'title' => $policy->title,
            'version' => $policy->version,
        ]);
        $title = __('messages.notifications.policy_published_title');

        User::query()->pluck('id')->each(
            fn (int $userId) => $this->notifyUser(
                $userId,
                $message,
                NotificationType::Info,
                $title,
                NotificationCategory::Compliance,
            ),
        );

        app(\App\Services\Integrations\IntegrationBridgeService::class)->notifyComplianceAlert($title, $message);
    }

    public function notifyContractPublished(\App\Models\Contract $contract): void
    {
        $this->notifyUser(
            $contract->employee_id,
            __('messages.notifications.contract_published_body', ['title' => $contract->title]),
            NotificationType::Info,
            __('messages.notifications.contract_published_title'),
            NotificationCategory::Compliance,
        );

        if ($contract->expires_at) {
            $days = now()->diffInDays($contract->expires_at, false);
            if ($days >= 0 && $days <= 14) {
                $this->notifyUser(
                    $contract->employee_id,
                    __('messages.notifications.contract_expiring_body', [
                        'title' => $contract->title,
                        'date' => $contract->expires_at->format('Y-m-d'),
                    ]),
                    NotificationType::Info,
                    __('messages.notifications.contract_expiring_title'),
                    NotificationCategory::Compliance,
                );
            }
        }

        app(\App\Services\Integrations\IntegrationBridgeService::class)->notifyComplianceAlert(
            __('messages.notifications.contract_published_title'),
            __('messages.notifications.contract_published_body', ['title' => $contract->title]),
        );
    }

    public function notifyContractSigned(\App\Models\Contract $contract): void
    {
        $contract->load('employee:id,name');
        $message = __('messages.notifications.contract_signed_body', [
            'name' => $contract->employee?->name ?? 'Employee',
            'title' => $contract->title,
        ]);

        $this->notifyAdminsAndManagers(
            $message,
            NotificationType::Success,
            __('messages.notifications.contract_signed_title'),
            NotificationCategory::Compliance,
        );
    }

    public function notifyAssetAssigned(\App\Models\AssetAssignment $assignment): void
    {
        $assignment->load('asset');
        $this->notifyUser(
            $assignment->employee_id,
            __('messages.notifications.asset_assigned_body', ['name' => $assignment->asset->name]),
            NotificationType::Info,
            __('messages.notifications.asset_assigned_title'),
            NotificationCategory::Asset,
        );
    }

    public function notifyMaintenanceScheduled(\App\Models\AssetMaintenance $maintenance): void
    {
        $maintenance->load('asset');
        $this->notifyAdminsAndManagers(
            __('messages.notifications.maintenance_scheduled_body', [
                'name' => $maintenance->asset->name,
                'date' => $maintenance->scheduled_date->format('Y-m-d'),
            ]),
            NotificationType::Info,
            __('messages.notifications.maintenance_scheduled_title'),
            NotificationCategory::Asset,
        );
    }

    public function notifyMaintenanceDue(\App\Models\AssetMaintenance $maintenance): void
    {
        $maintenance->load('asset');
        $this->notifyAdminsAndManagers(
            __('messages.notifications.maintenance_due_body', [
                'name' => $maintenance->asset->name,
                'date' => $maintenance->scheduled_date->format('Y-m-d'),
            ]),
            NotificationType::Info,
            __('messages.notifications.maintenance_due_title'),
            NotificationCategory::Asset,
        );
    }

    public function notifyAssetReturnDue(\App\Models\AssetAssignment $assignment): void
    {
        $assignment->load(['asset', 'employee:id,name']);
        $this->notifyUser(
            $assignment->employee_id,
            __('messages.notifications.asset_return_due_body', [
                'name' => $assignment->asset->name,
                'date' => $assignment->expected_return_date->format('Y-m-d'),
            ]),
            NotificationType::Info,
            __('messages.notifications.asset_return_due_title'),
            NotificationCategory::Asset,
        );
        $this->notifyAdminsAndManagers(
            __('messages.notifications.asset_return_due_admin_body', [
                'name' => $assignment->asset->name,
                'employee' => $assignment->employee?->name ?? '',
                'date' => $assignment->expected_return_date->format('Y-m-d'),
            ]),
            NotificationType::Info,
            __('messages.notifications.asset_return_due_title'),
            NotificationCategory::Asset,
        );
    }

    public function notifyTaskAssigned(Task $task): void
    {
        if (! $task->assigned_to) {
            return;
        }

        $task->loadMissing('project');
        $this->notifyUser(
            $task->assigned_to,
            __('messages.notifications.task_assigned_body', [
                'title' => $task->title,
                'project' => $task->project?->title ?? '',
            ]),
            NotificationType::Info,
            __('messages.notifications.task_assigned_title'),
            NotificationCategory::Project,
        );
    }

    public function notifyMilestoneDue(Milestone $milestone): void
    {
        $milestone->load(['project.manager']);
        $message = __('messages.notifications.milestone_due_body', [
            'title' => $milestone->title,
            'project' => $milestone->project->title,
            'date' => $milestone->target_date->format('Y-m-d'),
        ]);
        $title = __('messages.notifications.milestone_due_title');

        if ($milestone->project->manager_id) {
            $this->notifyUser(
                $milestone->project->manager_id,
                $message,
                NotificationType::Info,
                $title,
                NotificationCategory::Project,
            );
        }

        $this->notifyAdminsAndManagers($message, NotificationType::Info, $title, NotificationCategory::Project);
    }

    public function notifyGamification(int $userId, string $title, string $message): void
    {
        $this->notifyUser(
            $userId,
            $message,
            NotificationType::Info,
            $title,
            NotificationCategory::Gamification,
        );
    }

    public function notifyCandidateApplied(\App\Models\Candidate $candidate): void
    {
        $candidate->load('jobPosting');
        $message = __('messages.notifications.candidate_applied_body', [
            'name' => $candidate->candidate_name,
            'title' => $candidate->jobPosting?->title ?? 'Position',
        ]);

        $this->notifyAdminsAndManagers(
            $message,
            NotificationType::Info,
            __('messages.notifications.candidate_applied_title'),
            NotificationCategory::Recruitment,
        );

        app(\App\Services\Integrations\IntegrationBridgeService::class)->notifyRecruitmentUpdate(
            __('messages.notifications.candidate_applied_title'),
            $message,
        );
    }

    public function notifyOnboardingTaskDue(\App\Models\OnboardingTask $task): void
    {
        $task->load('employee:id,name');
        $this->notifyUser(
            $task->employee_id,
            __('messages.notifications.onboarding_task_due_body', [
                'title' => $task->task_title,
                'date' => $task->due_date->format('Y-m-d'),
            ]),
            NotificationType::Info,
            __('messages.notifications.onboarding_task_due_title'),
            NotificationCategory::Recruitment,
        );

        $this->notifyAdminsAndManagers(
            __('messages.notifications.onboarding_task_due_admin_body', [
                'employee' => $task->employee?->name ?? 'Employee',
                'title' => $task->task_title,
            ]),
            NotificationType::Info,
            __('messages.notifications.onboarding_task_due_title'),
            NotificationCategory::Recruitment,
        );
    }

    public function notifyDealCreated(\App\Models\Deal $deal): void
    {
        $deal->load('client:id,name');
        $message = __('messages.notifications.deal_created_body', [
            'title' => $deal->title,
            'client' => $deal->client?->name ?? 'Client',
            'value' => number_format((float) $deal->value, 2),
        ]);

        $this->notifyAdminsAndManagers(
            $message,
            NotificationType::Info,
            __('messages.notifications.deal_created_title'),
            NotificationCategory::Crm,
        );
    }

    public function notifyTicketAssigned(\App\Models\Ticket $ticket, int $assigneeId): void
    {
        $ticket->load('employee:id,name');
        $this->notifyUser(
            $assigneeId,
            __('messages.notifications.ticket_assigned_body', [
                'title' => $ticket->title,
                'employee' => $ticket->employee?->name ?? 'User',
            ]),
            NotificationType::Info,
            __('messages.notifications.ticket_assigned_title'),
            NotificationCategory::Helpdesk,
        );
    }

    public function notifyTicketResolved(\App\Models\Ticket $ticket): void
    {
        $ticket->load('employee:id,name');
        $this->notifyUser(
            $ticket->employee_id,
            __('messages.notifications.ticket_resolved_body', [
                'title' => $ticket->title,
            ]),
            NotificationType::Success,
            __('messages.notifications.ticket_resolved_title'),
            NotificationCategory::Helpdesk,
        );

        $this->notifyAdminsAndManagers(
            __('messages.notifications.ticket_resolved_admin_body', [
                'title' => $ticket->title,
                'employee' => $ticket->employee?->name ?? 'User',
            ]),
            NotificationType::Info,
            __('messages.notifications.ticket_resolved_title'),
            NotificationCategory::Helpdesk,
        );
    }

    public function notifyInvoiceOverdue(\App\Models\Invoice $invoice): void
    {
        $invoice->load('client:id,name');
        $this->notifyAdminsAndManagers(
            __('messages.notifications.invoice_overdue_body', [
                'number' => $invoice->invoice_number,
                'client' => $invoice->client?->name ?? 'Client',
                'amount' => number_format((float) $invoice->amount, 2),
            ]),
            NotificationType::Error,
            __('messages.notifications.invoice_overdue_title'),
            NotificationCategory::Finance,
        );
    }

    public function notifyBudgetExceeded(\App\Models\Budget $budget): void
    {
        $this->notifyAdminsAndManagers(
            __('messages.notifications.budget_exceeded_body', [
                'department' => $budget->department,
                'spent' => number_format((float) $budget->spent_amount, 2),
                'allocated' => number_format((float) $budget->allocated_amount, 2),
            ]),
            NotificationType::Error,
            __('messages.notifications.budget_exceeded_title'),
            NotificationCategory::Finance,
        );
    }

    public function notifyInventoryLowStock(\App\Models\Item $item): void
    {
        $this->notifyAdminsAndManagers(
            __('messages.notifications.inventory_low_stock_body', [
                'name' => $item->name,
                'quantity' => $item->quantity,
                'reorder' => $item->reorder_level,
            ]),
            NotificationType::Error,
            __('messages.notifications.inventory_low_stock_title'),
            NotificationCategory::Inventory,
        );
    }

    public function notifyPurchaseOrderApproved(\App\Models\PurchaseOrder $po): void
    {
        $po->load('supplier:id,name', 'creator:id,name');
        $message = __('messages.notifications.po_approved_body', [
            'number' => $po->po_number,
            'supplier' => $po->supplier?->name ?? 'Supplier',
            'total' => number_format((float) $po->total_amount, 2),
        ]);

        if ($po->created_by) {
            $this->notifyUser(
                $po->created_by,
                $message,
                NotificationType::Success,
                __('messages.notifications.po_approved_title'),
                NotificationCategory::Inventory,
            );
        }

        $this->notifyAdminsAndManagers(
            $message,
            NotificationType::Info,
            __('messages.notifications.po_approved_title'),
            NotificationCategory::Inventory,
        );
    }

    public function notifyTicketSlaBreached(\App\Models\Ticket $ticket): void
    {
        $this->notifyAdminsAndManagers(
            __('messages.notifications.ticket_sla_breach_body', [
                'title' => $ticket->title,
                'id' => $ticket->id,
            ]),
            NotificationType::Error,
            __('messages.notifications.ticket_sla_breach_title'),
            NotificationCategory::Helpdesk,
        );
    }

    public function notifyDealClosed(\App\Models\Deal $deal): void
    {
        $deal->load('client:id,name');
        $message = __('messages.notifications.deal_closed_body', [
            'title' => $deal->title,
            'client' => $deal->client?->name ?? 'Client',
            'status' => $deal->status->value,
        ]);

        $this->notifyAdminsAndManagers(
            $message,
            $deal->status->value === 'won' ? NotificationType::Success : NotificationType::Info,
            __('messages.notifications.deal_closed_title'),
            NotificationCategory::Crm,
        );
    }

    public function notifyKnowledgeArticlePublished(\App\Models\KnowledgeArticle $article): void
    {
        $message = __('messages.notifications.knowledge_article_body', [
            'title' => $article->title,
            'version' => $article->version,
        ]);
        $title = __('messages.notifications.knowledge_article_title');

        User::query()->pluck('id')->each(
            fn (int $userId) => $this->notifyUser(
                $userId,
                $message,
                NotificationType::Info,
                $title,
                NotificationCategory::Knowledge,
            ),
        );
    }

    public function notifyPerformanceReviewSubmitted(\App\Models\PerformanceReview $review): void
    {
        $review->load('reviewer:id,name');
        $this->notifyUser(
            $review->employee_id,
            __('messages.notifications.performance_review_body', [
                'reviewer' => $review->reviewer?->name ?? 'Manager',
                'rating' => $review->rating,
            ]),
            NotificationType::Info,
            __('messages.notifications.performance_review_title'),
            NotificationCategory::Performance,
        );
    }

    public function notifyFeedback360Submitted(\App\Models\Feedback360 $feedback): void
    {
        $this->notifyUser(
            $feedback->employee_id,
            __('messages.notifications.feedback_360_body'),
            NotificationType::Info,
            __('messages.notifications.feedback_360_title'),
            NotificationCategory::Performance,
        );
    }

    public function notifyKnowledgeDocumentPublished(\App\Models\KnowledgeDocument $document): void
    {
        $message = __('messages.notifications.knowledge_document_body', [
            'title' => $document->title,
            'version' => $document->version,
        ]);
        $title = __('messages.notifications.knowledge_document_title');

        User::query()->pluck('id')->each(
            fn (int $userId) => $this->notifyUser(
                $userId,
                $message,
                NotificationType::Info,
                $title,
                NotificationCategory::Knowledge,
            ),
        );
    }

    private function defaultTitle(NotificationCategory $category): string
    {
        return match ($category) {
            NotificationCategory::Request => 'Request update',
            NotificationCategory::Payroll => 'Payroll update',
            NotificationCategory::Training => 'Training update',
            NotificationCategory::Gamification => 'Achievement unlocked',
            NotificationCategory::Compliance => 'Compliance update',
            NotificationCategory::Asset => 'Asset update',
            NotificationCategory::Project => 'Project update',
            NotificationCategory::Knowledge => 'Knowledge Base update',
            NotificationCategory::Performance => 'Performance update',
            NotificationCategory::Recruitment => 'Recruitment update',
            NotificationCategory::Crm => 'CRM update',
            NotificationCategory::Helpdesk => 'Helpdesk update',
            NotificationCategory::Inventory => 'Inventory update',
            NotificationCategory::Finance => 'Finance update',
            NotificationCategory::System => 'WorkSphere alert',
            NotificationCategory::Customization => 'Customization update',
        };
    }

    public function notifyThemeApplied(\App\Models\User $user, string $theme): void
    {
        $this->notifyUser(
            $user->id,
            __('messages.notifications.theme_applied_body', ['theme' => $theme]),
            \App\Enums\NotificationType::Success,
            __('messages.notifications.theme_applied_title'),
            NotificationCategory::Customization,
        );
    }

    public function notifyWorkflowUpdated(\App\Models\User $user, string $workflowTitle, string $action): void
    {
        $this->notifyUser(
            $user->id,
            __('messages.notifications.workflow_updated_body', [
                'title' => $workflowTitle,
                'action' => $action,
            ]),
            \App\Enums\NotificationType::Info,
            __('messages.notifications.workflow_updated_title'),
            NotificationCategory::Customization,
        );
    }

    public function notifyDeploymentResult(\App\Models\Deployment $deployment, bool $success): void
    {
        $this->notifyAdminsAndManagers(
            $success
                ? __('messages.notifications.deployment_success_body', [
                    'env' => $deployment->environment,
                    'version' => $deployment->version,
                ])
                : __('messages.notifications.deployment_failed_body', [
                    'env' => $deployment->environment,
                    'version' => $deployment->version,
                ]),
            $success ? \App\Enums\NotificationType::Success : \App\Enums\NotificationType::Error,
            $success
                ? __('messages.notifications.deployment_success_title')
                : __('messages.notifications.deployment_failed_title'),
            NotificationCategory::System,
        );
    }

    public function notifyDeploymentRollback(\App\Models\User $actor, \App\Models\Deployment $deployment): void
    {
        $this->notifyAdminsAndManagers(
            __('messages.notifications.deployment_rollback_body', [
                'env' => $deployment->environment,
                'version' => $deployment->version,
                'actor' => $actor->name,
            ]),
            \App\Enums\NotificationType::Info,
            __('messages.notifications.deployment_rollback_title'),
            NotificationCategory::System,
        );
    }
}
