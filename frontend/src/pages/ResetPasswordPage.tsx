import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AuthBrandHeader from '../components/auth/AuthBrandHeader'
import { authApi } from '../services/api'
import { extractApiError } from '../utils/errors'

const inputClass =
  'mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-indigo-400'

export default function ResetPasswordPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const emailParam = searchParams.get('email') ?? ''

  const [email, setEmail] = useState(emailParam)
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!token) {
      setError(t('auth.resetTokenMissing'))
      return
    }
    setLoading(true)
    setError(null)
    try {
      await authApi.resetPassword({
        email,
        token,
        password,
        password_confirmation: passwordConfirmation,
      })
      setSuccess(true)
    } catch (err) {
      setError(extractApiError(err, t('auth.resetFailed')))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in-up w-full max-w-md">
      <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-xl shadow-indigo-500/10 backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/95 sm:p-8">
        <AuthBrandHeader compact />

        <h1 className="mt-6 text-center text-xl font-bold text-slate-900 dark:text-slate-100">
          {t('auth.resetTitle')}
        </h1>

        {success ? (
          <>
            <p className="mt-4 text-center text-sm text-emerald-700 dark:text-emerald-300">{t('auth.resetSuccess')}</p>
            <p className="mt-6 text-center">
              <Link to="/login" className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
                {t('auth.loginButton')}
              </Link>
            </p>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('auth.email')}
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('auth.newPassword')}
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label
                htmlFor="password_confirmation"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                {t('auth.confirmPassword')}
              </label>
              <input
                id="password_confirmation"
                type="password"
                required
                minLength={8}
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                className={inputClass}
              />
            </div>
            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50"
            >
              {loading ? t('auth.resetting') : t('auth.resetButton')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
