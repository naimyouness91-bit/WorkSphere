import i18n from '../i18n'
import type { UserRole } from '../types/auth'

export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/dashboard/admin'
    case 'manager':
      return '/dashboard/manager'
    case 'employee':
      return '/dashboard/employee'
    default:
      return '/login'
  }
}

export function getRoleLabel(role: UserRole): string {
  return i18n.t(`roles.${role}`)
}
