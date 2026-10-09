import { useTranslation } from 'react-i18next'

export default function HomeFooter() {
  const { t } = useTranslation()

  return (
    <footer className="animate-fade-in-up border-t border-slate-200 pt-8 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400 [animation-delay:400ms]">
      <p>{t('home.footer', { year: 2026 })}</p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
        {t('auth.tagline')}
      </p>
    </footer>
  )
}
