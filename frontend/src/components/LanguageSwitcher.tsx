import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { updateUserLocale } from '../store/authSlice'
import { setAppLocale, SUPPORTED_LOCALES, type AppLocale } from '../i18n'

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const dispatch = useAppDispatch()
  const { token } = useAppSelector((state) => state.auth)

  const handleChange = (locale: AppLocale) => {
    setAppLocale(locale)
    if (token) {
      void dispatch(updateUserLocale(locale))
    }
  }

  return (
    <label className="flex items-center gap-2 text-sm text-slate-600">
      <span className="sr-only">{t('nav.language')}</span>
      <select
        value={i18n.language.split('-')[0] as AppLocale}
        onChange={(e) => handleChange(e.target.value as AppLocale)}
        className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        aria-label={t('nav.language')}
      >
        {SUPPORTED_LOCALES.map((code) => (
          <option key={code} value={code}>
            {t(`languages.${code}`)}
          </option>
        ))}
      </select>
    </label>
  )
}
