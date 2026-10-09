import type { ComponentType, SVGProps } from 'react'
import type { UserRole } from '../types/auth'
import {
  IconApplications,
  IconCalendar,
  IconDashboard,
  IconDocuments,
  IconEmployees,
  IconEvaluations,
  IconHome,
  IconJobs,
  IconPayroll,
  IconRequests,
  IconSkills,
  IconTraining,
  IconAssistant,
  IconGamification,
  IconCompliance,
  IconAssets,
  IconKnowledge,
  IconPerformance,
  IconRecruitment,
  IconCrm,
  IconInventory,
  IconSecurity,
  IconIntegrations,
  IconOffline,
  IconSettings,
} from '../components/layout/navIcons'

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

export interface NavItemConfig {
  id: string
  labelKey: string
  icon: IconComponent
  path?: string
  useDashboardPath?: boolean
  roles?: UserRole[]
}

/** Core workplace modules shown in the sidebar (per product spec). */
export const authenticatedNavItems: NavItemConfig[] = [
  { id: 'dashboard', labelKey: 'nav.dashboard', icon: IconDashboard, useDashboardPath: true, roles: ['admin', 'manager', 'employee'] },
  { id: 'assistant', labelKey: 'nav.assistant', icon: IconAssistant, path: '/assistant', roles: ['admin', 'manager', 'employee'] },
  { id: 'gamification', labelKey: 'nav.gamification', icon: IconGamification, path: '/gamification', roles: ['admin', 'manager', 'employee'] },
  { id: 'compliance', labelKey: 'nav.compliance', icon: IconCompliance, path: '/compliance', roles: ['admin', 'manager', 'employee'] },
  { id: 'knowledge', labelKey: 'nav.knowledge', icon: IconKnowledge, path: '/knowledge', roles: ['admin', 'manager', 'employee'] },
  { id: 'assets', labelKey: 'nav.assets', icon: IconAssets, path: '/assets', roles: ['admin', 'manager', 'employee'] },
  { id: 'requests', labelKey: 'nav.requests', icon: IconRequests, path: '/requests', roles: ['admin', 'manager', 'employee'] },
  { id: 'mobile-offline', labelKey: 'nav.mobileOffline', icon: IconOffline, path: '/mobile-offline', roles: ['admin', 'manager', 'employee'] },
  { id: 'settings', labelKey: 'nav.settings', icon: IconSettings, path: '/settings', roles: ['admin', 'manager', 'employee'] },
  { id: 'documents', labelKey: 'nav.documents', icon: IconDocuments, path: '/documents', roles: ['admin', 'manager', 'employee'] },
  { id: 'calendar', labelKey: 'nav.calendar', icon: IconCalendar, path: '/calendar', roles: ['admin', 'manager', 'employee'] },
  { id: 'training', labelKey: 'nav.training', icon: IconTraining, path: '/training', roles: ['admin', 'manager', 'employee'] },
  { id: 'skills', labelKey: 'nav.skills', icon: IconSkills, path: '/skills', roles: ['admin', 'manager', 'employee'] },
  { id: 'evaluations', labelKey: 'nav.evaluations', icon: IconEvaluations, path: '/evaluations', roles: ['admin', 'manager', 'employee'] },
  { id: 'performance', labelKey: 'nav.performance', icon: IconPerformance, path: '/performance', roles: ['admin', 'manager', 'employee'] },
  { id: 'jobs', labelKey: 'nav.jobs', icon: IconJobs, path: '/jobs', roles: ['admin', 'manager', 'employee'] },
  { id: 'applications', labelKey: 'nav.applications', icon: IconApplications, path: '/applications', roles: ['admin', 'manager', 'employee'] },
  { id: 'recruitment', labelKey: 'nav.recruitment', icon: IconRecruitment, path: '/recruitment', roles: ['admin', 'manager', 'employee'] },
  { id: 'crm', labelKey: 'nav.crm', icon: IconCrm, path: '/crm', roles: ['admin', 'manager'] },
  { id: 'inventory', labelKey: 'nav.inventory', icon: IconInventory, path: '/inventory', roles: ['admin', 'manager'] },
  { id: 'security', labelKey: 'nav.security', icon: IconSecurity, path: '/audit-logs', roles: ['admin'] },
  { id: 'integrations', labelKey: 'nav.integrations', icon: IconIntegrations, path: '/integrations', roles: ['admin'] },
  { id: 'employees', labelKey: 'nav.employees', icon: IconEmployees, path: '/employees', roles: ['admin', 'manager'] },
  { id: 'payroll', labelKey: 'nav.payroll', icon: IconPayroll, path: '/payroll', roles: ['admin', 'manager'] },
]

export const guestNavItems: NavItemConfig[] = [
  { id: 'home', labelKey: 'nav.home', icon: IconHome, path: '/' },
  { id: 'login', labelKey: 'nav.login', icon: IconDashboard, path: '/login' },
  { id: 'register', labelKey: 'nav.register', icon: IconEmployees, path: '/register' },
]

export function filterNavItemsForRole(items: NavItemConfig[], role: UserRole): NavItemConfig[] {
  return items.filter((item) => !item.roles || item.roles.includes(role))
}
