import { useTranslation } from 'react-i18next'
import { useTheme } from '../../context/theme'

export default function ThemeToggle() {
  const { t } = useTranslation()
  const { isDark, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      aria-label={t('adminDashboard.toggleTheme')}
    >
      {isDark ? '☀️ ' + t('adminDashboard.lightMode') : '🌙 ' + t('adminDashboard.darkMode')}
    </button>
  )
}
