import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import { useAppDispatch, useAppSelector } from './hooks/redux'
import HomePage from './pages/HomePage'
import AuthLayout from './components/auth/AuthLayout'
import LoginPage from './pages/LoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import RegisterPage from './pages/RegisterPage'
import AdminDashboard from './pages/dashboards/AdminDashboard'
import EmployeeDashboard from './pages/dashboards/EmployeeDashboard'
import EmployeesPage from './pages/EmployeesPage'
import CalendarPage from './pages/CalendarPage'
import PayrollPage from './pages/PayrollPage'
import TrainingPage from './pages/TrainingPage'
import SkillsPage from './pages/SkillsPage'
import EvaluationsPage from './pages/EvaluationsPage'
import JobsPage from './pages/JobsPage'
import ApplicationsPage from './pages/ApplicationsPage'
import ProjectsPage from './pages/ProjectsPage'
import TasksPage from './pages/TasksPage'
import TicketsPage from './pages/TicketsPage'
import ChatPage from './pages/ChatPage'
import AttendancePage from './pages/AttendancePage'
import LeavesPage from './pages/LeavesPage'
import FinancePage from './pages/FinancePage'
import BudgetsPage from './pages/BudgetsPage'
import AuditLogsPage from './pages/AuditLogsPage'
import IntegrationsPage from './pages/IntegrationsPage'
import ReportsPage from './pages/ReportsPage'
import DocumentsPage from './pages/DocumentsPage'
import RequestsPage from './pages/RequestsPage'
import AssistantPage from './pages/AssistantPage'
import GamificationPage from './pages/GamificationPage'
import CompliancePage from './pages/CompliancePage'
import KnowledgeBasePage from './pages/KnowledgeBasePage'
import PerformancePage from './pages/PerformancePage'
import RecruitmentPage from './pages/RecruitmentPage'
import CrmPage from './pages/CrmPage'
import InventoryPage from './pages/InventoryPage'
import AssetsPage from './pages/AssetsPage'
import MobileOfflinePage from './pages/MobileOfflinePage'
import SettingsPage from './pages/SettingsPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import ManagerDashboard from './pages/dashboards/ManagerDashboard'
import RealtimeProvider from './components/RealtimeProvider'
import { fetchMe } from './store/authSlice'
import { getDashboardPath } from './utils/roles'

function DashboardRedirect() {
  const { t } = useTranslation()
  const { user, token } = useAppSelector((state) => state.auth)

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (!user) {
    return (
      <div className="px-4 py-12 text-center text-slate-600">{t('common.loading')}</div>
    )
  }

  return <Navigate to={getDashboardPath(user.role)} replace />
}

function AppRoutes() {
  const dispatch = useAppDispatch()
  const { token } = useAppSelector((state) => state.auth)

  useEffect(() => {
    if (token) {
      dispatch(fetchMe())
    }
  }, [dispatch, token])

  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
      </Route>

      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="dashboard" element={<DashboardRedirect />} />

        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="audit-logs" element={<AuditLogsPage />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['admin', 'manager']} />}>
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="dashboard/admin" element={<AdminDashboard />} />
          <Route path="dashboard/manager" element={<ManagerDashboard />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="payroll" element={<PayrollPage />} />
          <Route path="budgets" element={<BudgetsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="integrations" element={<IntegrationsPage />} />
        </Route>

        <Route
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager', 'employee']} />
          }
        >
          <Route path="dashboard/employee" element={<EmployeeDashboard />} />
          <Route path="assistant" element={<AssistantPage />} />
          <Route path="gamification" element={<GamificationPage />} />
          <Route path="compliance" element={<CompliancePage />} />
          <Route path="knowledge" element={<KnowledgeBasePage />} />
          <Route path="assets" element={<AssetsPage />} />
          <Route path="requests" element={<RequestsPage />} />
          <Route path="tickets" element={<TicketsPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="leaves" element={<LeavesPage />} />
          <Route path="finance" element={<FinancePage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="training" element={<TrainingPage />} />
          <Route path="skills" element={<SkillsPage />} />
          <Route path="evaluations" element={<EvaluationsPage />} />
          <Route path="performance" element={<PerformancePage />} />
          <Route path="jobs" element={<JobsPage />} />
          <Route path="applications" element={<ApplicationsPage />} />
          <Route path="recruitment" element={<RecruitmentPage />} />
          <Route path="crm" element={<CrmPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:projectId" element={<ProjectDetailPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="mobile-offline" element={<MobileOfflinePage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <RealtimeProvider>
        <AppRoutes />
      </RealtimeProvider>
    </BrowserRouter>
  )
}
