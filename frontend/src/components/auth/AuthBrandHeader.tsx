import { useTranslation } from 'react-i18next'

interface Props {
  compact?: boolean
}

export default function AuthBrandHeader({ compact = false }: Props) {
  const { t } = useTranslation()

  return (
    <div className="text-center">
      <div className="mx-auto inline-block rounded-2xl bg-black/20 p-2 shadow-2xl ring-1 ring-white/10 backdrop-blur-sm dark:bg-black/40">
        <img
          src="/images/worksphere-logo.png"
          alt={t('auth.brandAlt')}
          className={`mx-auto object-contain ${compact ? 'h-28 w-auto sm:h-32' : 'h-32 w-auto sm:h-40 md:h-44'}`}
          width={280}
          height={280}
        />
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.25em] text-slate-600 dark:text-sky-100/90">
        {t('auth.tagline')}
      </p>
    </div>
  )
}
