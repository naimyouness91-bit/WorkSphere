import { Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ThemeToggle from '../layout/ThemeToggle'

export default function AuthLayout() {
  const { t } = useTranslation()

  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-br from-[#0a1628] via-[#1e3a8a] to-[#7dd3fc] dark:from-[#020617] dark:via-[#172554] dark:to-[#1e40af]">
      {/* Brand orbit accents (blue, green, orange, purple) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -end-20 top-1/4 h-64 w-64 rounded-full bg-blue-500/25 blur-3xl" />
        <div className="absolute -start-16 bottom-1/4 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute end-1/4 bottom-0 h-48 w-48 rounded-full bg-orange-400/15 blur-3xl" />
        <div className="absolute start-1/3 top-0 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" />
      </div>

      <div className="relative flex justify-end p-4 sm:p-6">
        <ThemeToggle compact variant="hero" />
      </div>

      <main className="relative flex flex-1 flex-col items-center justify-center px-4 pb-8 sm:px-6">
        <Outlet />
      </main>

      <footer className="relative py-6 text-center text-xs font-medium text-white/80 dark:text-sky-200/70">
        {t('auth.footer', { year: 2026 })}
      </footer>
    </div>
  )
}
