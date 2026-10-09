import { useTranslation } from 'react-i18next'
import ThemeToggle from '../layout/ThemeToggle'
import type { User } from '../../types/auth'

interface Props {
  user: User | null
}

export default function HomeHero({ user }: Props) {
  const { t } = useTranslation()

  return (
    <section className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-[#1e3a8a] via-indigo-700 to-sky-500 px-6 py-10 shadow-xl shadow-blue-900/25 dark:border-indigo-900/50 dark:from-[#0f172a] dark:via-indigo-950 dark:to-blue-900 sm:px-10 sm:py-12">
      <div className="pointer-events-none absolute -end-20 -top-20 h-64 w-64 rounded-full bg-sky-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -start-16 h-48 w-48 rounded-full bg-violet-400/15 blur-2xl" />
      <div className="pointer-events-none absolute end-1/4 top-1/2 h-32 w-32 rounded-full bg-emerald-400/10 blur-2xl" />

      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="animate-fade-in-up flex gap-4 sm:gap-6">
          <img
            src="/images/worksphere-logo.png"
            alt={t('auth.brandAlt')}
            className="hidden h-20 w-20 shrink-0 object-contain drop-shadow-lg sm:block md:h-24 md:w-24"
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-200/90">
              {t('auth.tagline')}
            </p>
            <h1 className="mt-2 text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl">
              {t('home.heroTitle')}
            </h1>
            <p className="mt-3 max-w-xl text-sm text-sky-100 sm:text-base">
              {user
                ? t('home.heroSubtitleAuth', { name: user.name })
                : t('home.heroSubtitleGuest')}
            </p>
          </div>
        </div>
        <div className="animate-fade-in-up shrink-0 [animation-delay:100ms]">
          <ThemeToggle variant="hero" />
        </div>
      </div>
    </section>
  )
}
