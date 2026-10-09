import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ThemeToggle from './ThemeToggle'

interface Props {
  onMenuOpen?: () => void
  showMenuButton?: boolean
  menuIcon?: ReactNode
}

export default function AppHeader({ onMenuOpen, showMenuButton, menuIcon }: Props) {
  const { t } = useTranslation()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90 sm:px-6">
      {showMenuButton && onMenuOpen && menuIcon && (
        <button
          type="button"
          onClick={onMenuOpen}
          className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
          aria-label={t('nav.openMenu')}
        >
          {menuIcon}
        </button>
      )}

      <Link to="/" className="flex min-w-0 flex-1 items-center gap-3 lg:flex-initial">
        <img
          src="/images/worksphere-logo.png"
          alt={t('auth.brandAlt')}
          className="h-10 w-auto shrink-0 object-contain sm:h-11"
        />
        <div className="hidden min-w-0 sm:block">
          <p className="truncate text-sm font-bold leading-tight">
            <span className="text-blue-600 dark:text-sky-400">Work</span>
            <span className="text-slate-800 dark:text-slate-100">Sphere</span>
          </p>
          <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t('auth.tagline')}
          </p>
        </div>
      </Link>

      <div className="ms-auto">
        <ThemeToggle compact />
      </div>
    </header>
  )
}
