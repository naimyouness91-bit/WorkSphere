import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import HomeHero from './HomeHero'
import HomeFeatureCards from './HomeFeatureCards'

export default function GuestLanding() {
  const { t } = useTranslation()

  return (
    <div className="space-y-10">
      <HomeHero user={null} />
      <HomeFeatureCards />

      <section className="animate-fade-in-up rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 sm:p-12 [animation-delay:350ms]">
        <img
          src="/images/worksphere-logo.png"
          alt={t('auth.brandAlt')}
          className="mx-auto h-24 w-auto object-contain sm:h-28"
        />
        <p className="mx-auto mt-4 max-w-md text-slate-600 dark:text-slate-400">{t('home.ctaText')}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/login"
            className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-700"
          >
            {t('home.logIn')}
          </Link>
          <Link
            to="/register"
            className="rounded-lg border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {t('nav.register')}
          </Link>
        </div>
      </section>
    </div>
  )
}
