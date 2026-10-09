import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { updateUserLocale } from '../../store/authSlice'
import { setAppLocale, SUPPORTED_LOCALES, type AppLocale } from '../../i18n'

interface Props {
  collapsed: boolean
}

export default function SidebarLanguageSwitcher({ collapsed }: Props) {
  const { i18n, t } = useTranslation()
  const dispatch = useAppDispatch()
  const { token } = useAppSelector((state) => state.auth)

  const handleChange = (locale: AppLocale) => {
    setAppLocale(locale)
    if (token) {
      void dispatch(updateUserLocale(locale))
    }
  }

  const current = i18n.language.split('-')[0] as AppLocale

  if (collapsed) {
    return (
      <select
        value={current}
        onChange={(e) => handleChange(e.target.value as AppLocale)}
        className="w-full rounded-lg border border-slate-600 bg-slate-800 px-1 py-2 text-center text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
        aria-label={t('nav.language')}
        title={t('nav.language')}
      >
        {SUPPORTED_LOCALES.map((code) => (
          <option key={code} value={code}>
            {code.toUpperCase()}
          </option>
        ))}
      </select>
    )
  }

  return (
    <div className="px-1">
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-400">
        {t('nav.language')}
      </label>
      <select
        value={current}
        onChange={(e) => handleChange(e.target.value as AppLocale)}
        className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        aria-label={t('nav.language')}
      >
        {SUPPORTED_LOCALES.map((code) => (
          <option key={code} value={code}>
            {t(`languages.${code}`)}
          </option>
        ))}
      </select>
    </div>
  )
}
