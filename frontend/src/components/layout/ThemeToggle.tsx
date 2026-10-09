import { useTranslation } from 'react-i18next'
import { useTheme } from '../../context/theme'

interface Props {
  compact?: boolean
  variant?: 'default' | 'sidebar' | 'hero'
}

export default function ThemeToggle({ compact = false, variant = 'default' }: Props) {
  const { t } = useTranslation()
  const { isDark, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={[
        'inline-flex items-center gap-2 rounded-lg border transition-all duration-200',
        variant === 'sidebar' &&
          'border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700 w-full justify-center',
        variant === 'hero' &&
          'border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20',
        variant === 'default' &&
          'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700',
        compact ? 'p-2' : 'px-3 py-2 text-sm font-medium',
        variant === 'sidebar' && !compact ? 'w-full justify-center' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={isDark ? t('home.lightMode') : t('home.darkMode')}
    >
      {isDark ? (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
      {!compact && <span>{isDark ? t('home.lightMode') : t('home.darkMode')}</span>}
    </button>
  )
}
