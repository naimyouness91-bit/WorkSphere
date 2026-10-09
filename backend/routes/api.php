<?php

use App\Http\Controllers\Api\AdminDashboardController;
use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\DashboardAnalyticsController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\EmployeeDashboardController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\ManagerDashboardController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\ApplicationController;
use App\Http\Controllers\Api\EvaluationController;
use App\Http\Controllers\Api\JobController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\PayrollController;
use App\Http\Controllers\Api\RequestController;
use App\Http\Controllers\Api\SkillController;
use App\Http\Controllers\Api\TrainingController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\TicketController;
use App\Http\Controllers\Api\ConversationController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\LeaveController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\BudgetController;
use App\Http\Controllers\Api\FinanceController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\SecurityController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\IntegrationController;
use App\Http\Controllers\Api\HomeController;
use App\Http\Controllers\Api\MobileController;
use App\Http\Controllers\Api\MobileSyncController;
use App\Http\Controllers\Api\MobileOfflineController;
use App\Http\Controllers\Api\DeviceTokenController;
use App\Http\Controllers\Api\NotificationPreferenceController;
use App\Http\Controllers\Api\AssistantController;
use App\Http\Controllers\Api\GamificationController;
use App\Http\Controllers\Api\PolicyController;
use App\Http\Controllers\Api\ContractController;
use App\Http\Controllers\Api\ComplianceController;
use App\Http\Controllers\Api\AssetController;
use App\Http\Controllers\Api\MilestoneController;
use App\Http\Controllers\Api\KnowledgeBaseController;
use App\Http\Controllers\Api\PerformanceController;
use App\Http\Controllers\Api\RecruitmentController;
use App\Http\Controllers\Api\CrmController;
use App\Http\Controllers\Api\HelpdeskController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\AccountingController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\DevOpsController;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;

Route::get('/health', [HealthController::class, 'index']);

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);

    Route::middleware('auth:api')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::patch('/locale', [AuthController::class, 'updateLocale']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/refresh', [AuthController::class, 'refresh']);
        Route::post('/sanctum-token', [AuthController::class, 'createSanctumToken']);
    });
});

Route::post('devops/deployments', [DevOpsController::class, 'recordDeployment']);

Route::middleware('auth:api')->group(function () {
    Broadcast::routes();

    Route::get('home/overview', [HomeController::class, 'overview']);

    Route::prefix('devops')->middleware('role:admin')->group(function () {
        Route::get('deployments', [DevOpsController::class, 'deployments']);
        Route::get('metrics', [DevOpsController::class, 'metrics']);
        Route::post('deployments/{deployment}/rollback', [DevOpsController::class, 'rollback']);
    });

    Route::prefix('settings')->group(function () {
        Route::get('stats', [SettingsController::class, 'stats']);
        Route::get('theme', [SettingsController::class, 'getThemeSettings']);
        Route::put('theme', [SettingsController::class, 'updateThemeSettings']);
        Route::get('workflows', [SettingsController::class, 'getWorkflows']);
        Route::post('workflows', [SettingsController::class, 'addWorkflow']);
        Route::put('workflows/{workflow}', [SettingsController::class, 'updateWorkflow']);
        Route::get('workflows/export', [SettingsController::class, 'exportWorkflows']);
        Route::get('workflows/approval-chain', [SettingsController::class, 'approvalChain']);
        Route::get('system', [SettingsController::class, 'getSystemSettings']);
        Route::patch('system', [SettingsController::class, 'updateSystemSetting']);
        Route::get('history', [SettingsController::class, 'customizationHistory']);
    });

    Route::prefix('assistant')->group(function () {
        Route::get('suggest', [AssistantController::class, 'suggest']);
        Route::post('chat', [AssistantController::class, 'chat']);
        Route::get('history', [AssistantController::class, 'history']);
        Route::get('stats', [AssistantController::class, 'stats']);
    });

    Route::prefix('gamification')->group(function () {
        Route::get('badges', [GamificationController::class, 'badges']);
        Route::get('points', [GamificationController::class, 'points']);
        Route::get('leaderboard', [GamificationController::class, 'leaderboard']);
        Route::get('overview', [GamificationController::class, 'overview']);
    });

    Route::prefix('assets')->group(function () {
        Route::get('/', [AssetController::class, 'index']);
        Route::post('/', [AssetController::class, 'store']);
        Route::get('export', [AssetController::class, 'export']);
        Route::get('lookup', [AssetController::class, 'lookupByQr']);
        Route::get('{asset}', [AssetController::class, 'show']);
        Route::get('{asset}/history', [AssetController::class, 'history']);
        Route::get('{asset}/qr', [AssetController::class, 'qr']);
        Route::post('{asset}/assign', [AssetController::class, 'assign']);
        Route::post('{asset}/return', [AssetController::class, 'returnAsset']);
        Route::post('{asset}/maintenance', [AssetController::class, 'scheduleMaintenance']);
        Route::post('maintenance/{maintenance}/complete', [AssetController::class, 'completeMaintenance']);
    });

    Route::prefix('accounting')->group(function () {
        Route::get('overview', [AccountingController::class, 'overview']);
        Route::get('budgets', [AccountingController::class, 'getBudgets']);
        Route::post('expenses', [AccountingController::class, 'addExpense']);
        Route::get('invoices', [AccountingController::class, 'getInvoices']);
        Route::post('invoices', [AccountingController::class, 'createInvoice']);
        Route::patch('invoices/{invoice}/status', [AccountingController::class, 'updateInvoiceStatus']);
        Route::get('transactions', [AccountingController::class, 'getTransactions']);
        Route::get('export', [AccountingController::class, 'export']);
        Route::get('audit-logs', [AccountingController::class, 'auditLogs']);
        Route::get('history', [AccountingController::class, 'history']);
    });

    Route::prefix('inventory')->group(function () {
        Route::get('overview', [InventoryController::class, 'overview']);
        Route::get('items', [InventoryController::class, 'getItems']);
        Route::post('items', [InventoryController::class, 'addItem']);
        Route::get('items/export', [InventoryController::class, 'exportItems']);
        Route::get('items/lookup', [InventoryController::class, 'lookupByQr']);
        Route::get('items/{item}', [InventoryController::class, 'showItem']);
        Route::get('items/{item}/qr', [InventoryController::class, 'itemQr']);
        Route::get('suppliers', [InventoryController::class, 'getSuppliers']);
        Route::get('purchase-orders', [InventoryController::class, 'getPurchaseOrders']);
        Route::post('purchase-orders', [InventoryController::class, 'createPurchaseOrder']);
        Route::get('purchase-orders/export', [InventoryController::class, 'exportPurchaseOrders']);
        Route::patch('purchase-orders/{purchaseOrder}/status', [InventoryController::class, 'updatePurchaseOrderStatus']);
        Route::get('stock-movements', [InventoryController::class, 'getStockMovements']);
        Route::post('stock-movements', [InventoryController::class, 'recordStockMovement']);
        Route::get('audit-logs', [InventoryController::class, 'auditLogs']);
        Route::get('history', [InventoryController::class, 'history']);
    });

    Route::prefix('helpdesk')->group(function () {
        Route::get('overview', [HelpdeskController::class, 'overview']);
        Route::get('tickets', [HelpdeskController::class, 'getTickets']);
        Route::post('tickets', [HelpdeskController::class, 'createTicket']);
        Route::get('tickets/export', [HelpdeskController::class, 'export']);
        Route::get('categories', [HelpdeskController::class, 'categories']);
        Route::get('sla', [HelpdeskController::class, 'getSLA']);
        Route::get('tickets/{ticket}', [HelpdeskController::class, 'show']);
        Route::patch('tickets/{ticket}/assign', [HelpdeskController::class, 'assignTicket']);
        Route::patch('tickets/{ticket}/status', [HelpdeskController::class, 'updateTicketStatus']);
        Route::post('tickets/{ticket}/comments', [HelpdeskController::class, 'addComment']);
        Route::get('tickets/{ticket}/suggestions', [HelpdeskController::class, 'suggestions']);
        Route::post('tickets/{ticket}/chat', [HelpdeskController::class, 'startChat']);
    });

    Route::prefix('crm')->group(function () {
        Route::get('overview', [CrmController::class, 'overview']);
        Route::get('clients', [CrmController::class, 'getClients']);
        Route::post('clients', [CrmController::class, 'addClient']);
        Route::get('clients/export', [CrmController::class, 'exportClients']);
        Route::get('partners', [CrmController::class, 'getPartners']);
        Route::post('partners', [CrmController::class, 'addPartner']);
        Route::get('partners/export', [CrmController::class, 'exportPartners']);
        Route::get('interactions', [CrmController::class, 'getInteractions']);
        Route::post('interactions', [CrmController::class, 'logInteraction']);
        Route::get('deals', [CrmController::class, 'getDeals']);
        Route::post('deals', [CrmController::class, 'addDeal']);
        Route::patch('deals/{deal}/status', [CrmController::class, 'updateDealStatus']);
        Route::post('integrations/sync', [CrmController::class, 'syncIntegrations']);
        Route::get('audit-logs', [CrmController::class, 'auditLogs']);
    });

    Route::prefix('recruitment')->group(function () {
        Route::get('overview', [RecruitmentController::class, 'overview']);
        Route::get('job-postings', [RecruitmentController::class, 'getJobPostings']);
        Route::post('job-postings', [RecruitmentController::class, 'addJobPosting']);
        Route::get('candidates', [RecruitmentController::class, 'getCandidates']);
        Route::post('candidates', [RecruitmentController::class, 'applyCandidate']);
        Route::patch('candidates/{candidate}/status', [RecruitmentController::class, 'updateCandidateStatus']);
        Route::get('candidates/export', [RecruitmentController::class, 'exportCandidates']);
        Route::get('candidates/{candidate}/resume/preview', [RecruitmentController::class, 'previewResume']);
        Route::get('candidates/{candidate}/resume/download', [RecruitmentController::class, 'downloadResume']);
        Route::get('onboarding-tasks', [RecruitmentController::class, 'getOnboardingTasks']);
        Route::patch('onboarding-tasks/{onboardingTask}/complete', [RecruitmentController::class, 'completeOnboardingTask']);
        Route::get('history', [RecruitmentController::class, 'history']);
    });

    Route::prefix('performance')->group(function () {
        Route::get('overview', [PerformanceController::class, 'overview']);
        Route::get('goals', [PerformanceController::class, 'getGoals']);
        Route::post('goals', [PerformanceController::class, 'addGoal']);
        Route::get('reviews', [PerformanceController::class, 'getReviews']);
        Route::post('reviews', [PerformanceController::class, 'addReview']);
        Route::get('feedback360', [PerformanceController::class, 'getFeedback360']);
        Route::post('feedback360', [PerformanceController::class, 'addFeedback360']);
        Route::get('history', [PerformanceController::class, 'history']);
        Route::get('report', [PerformanceController::class, 'report']);
        Route::get('training-suggestions', [PerformanceController::class, 'trainingSuggestions']);
        Route::get('colleagues', [PerformanceController::class, 'colleagues']);
    });

    Route::prefix('knowledge')->group(function () {
        Route::get('overview', [KnowledgeBaseController::class, 'overview']);
        Route::get('search', [KnowledgeBaseController::class, 'search']);
        Route::get('articles', [KnowledgeBaseController::class, 'getArticles']);
        Route::post('articles', [KnowledgeBaseController::class, 'addArticle']);
        Route::get('articles/{article}', [KnowledgeBaseController::class, 'showArticle']);
        Route::get('articles/{article}/versions', [KnowledgeBaseController::class, 'articleVersions']);
        Route::post('articles/{article}/rate', [KnowledgeBaseController::class, 'rateArticle']);
        Route::get('faqs', [KnowledgeBaseController::class, 'getFAQs']);
        Route::get('documents', [KnowledgeBaseController::class, 'getDocuments']);
        Route::post('documents', [KnowledgeBaseController::class, 'uploadDocument']);
        Route::get('documents/{document}/versions', [KnowledgeBaseController::class, 'documentVersions']);
        Route::get('documents/{document}/download', [KnowledgeBaseController::class, 'downloadDocument']);
        Route::get('documents/{document}/preview', [KnowledgeBaseController::class, 'previewDocument']);
    });

    Route::prefix('compliance')->group(function () {
        Route::get('overview', [ComplianceController::class, 'overview']);
        Route::get('report', [ComplianceController::class, 'report']);
        Route::get('policies', [PolicyController::class, 'index']);
        Route::post('policies', [PolicyController::class, 'store']);
        Route::get('policies/{policy}/versions', [PolicyController::class, 'versions']);
        Route::get('policies/{policy}/download', [PolicyController::class, 'download']);
        Route::get('policies/{policy}/preview', [PolicyController::class, 'preview']);
        Route::get('contracts', [ContractController::class, 'index']);
        Route::post('contracts', [ContractController::class, 'store']);
        Route::post('contracts/{contract}/sign', [ContractController::class, 'sign']);
        Route::get('contracts/{contract}/download', [ContractController::class, 'download']);
        Route::get('contracts/{contract}/preview', [ContractController::class, 'preview']);
    });

    Route::prefix('mobile')->group(function () {
        Route::get('dashboard', [MobileController::class, 'dashboard']);
        Route::get('notifications', [MobileController::class, 'notifications']);
        Route::post('requests', [MobileController::class, 'storeRequest']);
        Route::post('device-tokens', [DeviceTokenController::class, 'store']);
        Route::delete('device-tokens', [DeviceTokenController::class, 'destroy']);
        Route::get('notification-preferences', [NotificationPreferenceController::class, 'show']);
        Route::patch('notification-preferences', [NotificationPreferenceController::class, 'update']);
        Route::get('offline-data', [MobileOfflineController::class, 'getOfflineData']);
        Route::post('sync-offline', [MobileOfflineController::class, 'syncOfflineChanges']);
        Route::get('sync-logs', [MobileOfflineController::class, 'syncLogs']);
        Route::post('sync', [MobileSyncController::class, 'sync']);
    });

    Route::get('notifications', [NotificationController::class, 'index']);
    Route::patch('notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::patch('notifications/{appNotification}/read', [NotificationController::class, 'markAsRead']);

    Route::prefix('dashboard')->group(function () {
        Route::middleware('role:admin,manager')->group(function () {
            Route::get('/analytics', [DashboardAnalyticsController::class, 'index']);
            Route::get('/manager', [ManagerDashboardController::class, 'index']);
        });

        Route::middleware('role:admin')->group(function () {
            Route::get('/admin/overview', [AdminDashboardController::class, 'overview']);
            Route::get('/admin/requests', [AdminDashboardController::class, 'requests']);
        });

        Route::middleware('role:admin,manager,employee')->group(function () {
            Route::get('/employee', [EmployeeDashboardController::class, 'index']);
        });
    });

    Route::middleware('role:admin,manager')->group(function () {
        Route::get('reports/statistics', [ReportController::class, 'statistics']);
        Route::get('reports/statistics/drill-down', [ReportController::class, 'drillDown']);
        Route::get('reports', [ReportController::class, 'index']);
        Route::post('reports', [ReportController::class, 'store']);
        Route::get('reports/{report}', [ReportController::class, 'show']);
        Route::patch('reports/{report}/schedule', [ReportController::class, 'updateSchedule']);

        Route::prefix('analytics')->group(function () {
            Route::get('overview', [AnalyticsController::class, 'overview']);
            Route::get('insights', [AnalyticsController::class, 'insights']);
            Route::post('insights/refresh', [AnalyticsController::class, 'refreshInsights']);
            Route::get('reports', [AnalyticsController::class, 'reports']);
            Route::post('reports/generate', [AnalyticsController::class, 'generateReport']);
            Route::get('audit-logs', [AnalyticsController::class, 'auditLogs']);
        });
    });

    Route::middleware('role:admin')->group(function () {
        Route::get('integrations/summary', [IntegrationController::class, 'summary']);
        Route::get('integrations/export', [IntegrationController::class, 'export']);
        Route::get('integrations/logs/export', [IntegrationController::class, 'exportLogs']);
        Route::get('integrations/logs', [IntegrationController::class, 'logs']);
        Route::get('integrations/webhook-logs', [IntegrationController::class, 'webhookLogs']);
        Route::post('integrations/connect', [IntegrationController::class, 'connect']);
        Route::post('integrations/message', [IntegrationController::class, 'sendMessage']);
        Route::post('integrations/email', [IntegrationController::class, 'sendEmail']);
        Route::post('integrations/sync-calendars', [IntegrationController::class, 'syncCalendars']);
        Route::post('integrations/{integration}/test', [IntegrationController::class, 'test']);
        Route::get('integrations', [IntegrationController::class, 'index']);
        Route::post('integrations', [IntegrationController::class, 'store']);
        Route::put('integrations/{integration}', [IntegrationController::class, 'update']);
        Route::delete('integrations/{integration}', [IntegrationController::class, 'destroy']);

        Route::get('audit-logs/summary', [AuditLogController::class, 'summary']);
        Route::get('audit-logs/alerts', [AuditLogController::class, 'alerts']);
        Route::get('audit-logs', [AuditLogController::class, 'index']);
        Route::get('audit-logs/{auditLog}', [AuditLogController::class, 'show']);

        Route::prefix('security')->group(function () {
            Route::get('overview', [SecurityController::class, 'overview']);
            Route::get('summary', [SecurityController::class, 'summary']);
            Route::get('audit-logs', [SecurityController::class, 'auditLogs']);
            Route::get('audit-logs/{auditLog}', [SecurityController::class, 'showAuditLog']);
            Route::get('alerts', [SecurityController::class, 'alerts']);
            Route::patch('alerts/{securityAlert}/resolve', [SecurityController::class, 'resolveAlert']);
            Route::get('permissions', [SecurityController::class, 'permissions']);
            Route::post('permissions', [SecurityController::class, 'addPermission']);
            Route::delete('permissions/{permission}', [SecurityController::class, 'removePermission']);
            Route::get('export', [SecurityController::class, 'export']);
            Route::get('verify-integrity', [SecurityController::class, 'verifyIntegrity']);
        });
    });

    Route::middleware('role:admin,manager')->group(function () {
        Route::apiResource('employees', EmployeeController::class)->except(['show']);
        Route::get('users', [UserController::class, 'index']);
        Route::get('payrolls/summary', [PayrollController::class, 'summary']);
        Route::get('payrolls', [PayrollController::class, 'index']);
        Route::post('payrolls', [PayrollController::class, 'store']);
        Route::get('payrolls/{payroll}', [PayrollController::class, 'show']);
        Route::put('payrolls/{payroll}', [PayrollController::class, 'update']);
    });

    Route::get('documents', [DocumentController::class, 'index']);
    Route::post('documents', [DocumentController::class, 'store']);
    Route::get('documents/{document}/download', [DocumentController::class, 'download']);
    Route::get('documents/{document}/preview', [DocumentController::class, 'preview']);
    Route::delete('documents/{document}', [DocumentController::class, 'destroy']);

    Route::get('events', [EventController::class, 'index']);
    Route::post('events', [EventController::class, 'store']);
    Route::get('events/{event}', [EventController::class, 'show']);
    Route::put('events/{event}', [EventController::class, 'update']);

    Route::get('trainings', [TrainingController::class, 'index']);
    Route::post('trainings', [TrainingController::class, 'store']);
    Route::get('trainings/{training}', [TrainingController::class, 'show']);
    Route::put('trainings/{training}', [TrainingController::class, 'update']);
    Route::delete('trainings/{training}', [TrainingController::class, 'destroy']);

    Route::get('evaluations/departments', [EvaluationController::class, 'departments']);
    Route::get('evaluations/summary', [EvaluationController::class, 'summary']);
    Route::get('evaluations', [EvaluationController::class, 'index']);
    Route::post('evaluations', [EvaluationController::class, 'store']);
    Route::get('evaluations/{evaluation}', [EvaluationController::class, 'show']);
    Route::put('evaluations/{evaluation}', [EvaluationController::class, 'update']);

    Route::get('skills', [SkillController::class, 'index']);
    Route::post('skills', [SkillController::class, 'store']);
    Route::get('skills/{skill}', [SkillController::class, 'show']);
    Route::put('skills/{skill}', [SkillController::class, 'update']);
    Route::delete('skills/{skill}', [SkillController::class, 'destroy']);

    Route::get('jobs', [JobController::class, 'index']);
    Route::post('jobs', [JobController::class, 'store']);
    Route::get('jobs/{job}', [JobController::class, 'show']);
    Route::put('jobs/{job}', [JobController::class, 'update']);
    Route::delete('jobs/{job}', [JobController::class, 'destroy']);

    Route::get('applications', [ApplicationController::class, 'index']);
    Route::post('applications', [ApplicationController::class, 'store']);
    Route::get('applications/{application}', [ApplicationController::class, 'show']);
    Route::put('applications/{application}', [ApplicationController::class, 'update']);
    Route::delete('applications/{application}', [ApplicationController::class, 'destroy']);
    Route::get('applications/{application}/resume', [ApplicationController::class, 'downloadResume']);

    Route::get('requests', [RequestController::class, 'index']);
    Route::post('requests', [RequestController::class, 'store']);
    Route::get('requests/{internalRequest}', [RequestController::class, 'show']);
    Route::put('requests/{internalRequest}', [RequestController::class, 'update']);

    Route::get('projects', [ProjectController::class, 'index']);
    Route::post('projects', [ProjectController::class, 'store']);
    Route::get('projects/{project}', [ProjectController::class, 'show']);
    Route::get('projects/{project}/overview', [ProjectController::class, 'overview']);
    Route::get('projects/{project}/board', [ProjectController::class, 'board']);
    Route::get('projects/{project}/history', [ProjectController::class, 'history']);
    Route::get('projects/{project}/export', [ProjectController::class, 'exportPlan']);
    Route::put('projects/{project}', [ProjectController::class, 'update']);
    Route::delete('projects/{project}', [ProjectController::class, 'destroy']);
    Route::get('projects/{project}/milestones', [MilestoneController::class, 'index']);
    Route::post('projects/{project}/milestones', [MilestoneController::class, 'store']);
    Route::put('projects/{project}/milestones/{milestone}', [MilestoneController::class, 'update']);

    Route::get('tasks', [TaskController::class, 'index']);
    Route::post('tasks', [TaskController::class, 'store']);
    Route::get('tasks/{task}', [TaskController::class, 'show']);
    Route::put('tasks/{task}', [TaskController::class, 'update']);
    Route::patch('tasks/{task}/status', [TaskController::class, 'updateStatus']);
    Route::patch('tasks/{task}/complete', [TaskController::class, 'complete']);
    Route::delete('tasks/{task}', [TaskController::class, 'destroy']);

    Route::get('tickets', [TicketController::class, 'index']);
    Route::post('tickets', [TicketController::class, 'store']);
    Route::get('tickets/{ticket}', [TicketController::class, 'show']);
    Route::put('tickets/{ticket}', [TicketController::class, 'update']);

    Route::get('conversations', [ConversationController::class, 'index']);
    Route::post('conversations', [ConversationController::class, 'store']);
    Route::get('conversations/{conversation}', [ConversationController::class, 'show']);
    Route::post('conversations/{conversation}/typing', [ConversationController::class, 'typing']);

    Route::get('conversations/{conversation}/messages', [MessageController::class, 'index']);
    Route::post('conversations/{conversation}/messages', [MessageController::class, 'store']);
    Route::get('messages/{message}', [MessageController::class, 'show']);
    Route::patch('messages/{message}/read', [MessageController::class, 'update']);
    Route::get('messages/{message}/attachment', [MessageController::class, 'download']);

    Route::get('attendances', [AttendanceController::class, 'index']);
    Route::post('attendances', [AttendanceController::class, 'store']);
    Route::get('attendances/today', [AttendanceController::class, 'today']);
    Route::get('attendances/report', [AttendanceController::class, 'report']);
    Route::get('attendances/summary', [AttendanceController::class, 'summary']);
    Route::post('attendances/check-in', [AttendanceController::class, 'checkIn']);
    Route::post('attendances/check-out', [AttendanceController::class, 'checkOut']);
    Route::get('attendances/{attendance}', [AttendanceController::class, 'show']);
    Route::put('attendances/{attendance}', [AttendanceController::class, 'update']);
    Route::delete('attendances/{attendance}', [AttendanceController::class, 'destroy']);

    Route::get('finance/summary', [FinanceController::class, 'summary']);
    Route::get('finance/report', [FinanceController::class, 'report']);

    Route::get('expenses', [ExpenseController::class, 'index']);
    Route::post('expenses', [ExpenseController::class, 'store']);
    Route::get('expenses/{expense}', [ExpenseController::class, 'show']);
    Route::put('expenses/{expense}', [ExpenseController::class, 'update']);
    Route::delete('expenses/{expense}', [ExpenseController::class, 'destroy']);

    Route::get('budgets/departments', [BudgetController::class, 'departments']);
    Route::get('budgets', [BudgetController::class, 'index']);
    Route::post('budgets', [BudgetController::class, 'store']);
    Route::get('budgets/{budget}', [BudgetController::class, 'show']);
    Route::put('budgets/{budget}', [BudgetController::class, 'update']);
    Route::delete('budgets/{budget}', [BudgetController::class, 'destroy']);

    Route::get('leaves/calendar', [LeaveController::class, 'calendar']);
    Route::get('leaves', [LeaveController::class, 'index']);
    Route::post('leaves', [LeaveController::class, 'store']);
    Route::get('leaves/{leave}', [LeaveController::class, 'show']);
    Route::put('leaves/{leave}', [LeaveController::class, 'update']);
    Route::delete('leaves/{leave}', [LeaveController::class, 'destroy']);
});
