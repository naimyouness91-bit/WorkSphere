import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AuthBrandHeader from '../components/auth/AuthBrandHeader'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { clearError, login } from '../store/authSlice'
import { getDashboardPath } from '../utils/roles'

const inputClass =
  'mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-all duration-200 hover:border-sky-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-sky-500 dark:focus:border-sky-400'

export default function LoginPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { status, error, token } = useAppSelector((state) => state.auth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (token) {
      navigate('/', { replace: true })
    }
  }, [token, navigate])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    dispatch(clearError())
    const result = await dispatch(login({ email, password }))
    if (login.fulfilled.match(result)) {
      navigate(getDashboardPath(result.payload.user.role))
    }
  }

  return (
    <div className="animate-fade-in-up w-full max-w-md">
      <div className="rounded-2xl border border-white/20 bg-white/95 p-6 shadow-2xl shadow-blue-900/20 backdrop-blur-md transition-shadow duration-300 hover:shadow-blue-900/30 dark:border-slate-600/50 dark:bg-slate-900/90 dark:shadow-black/40 sm:p-8">
        <AuthBrandHeader />

        <h1 className="mt-6 text-center text-xl font-bold text-slate-900 dark:text-slate-100">
          {t('auth.loginTitle')}
        </h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('auth.emailOrUsername')}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder={t('auth.emailPlaceholder')}
            />
          </div>
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('auth.password')}
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-blue-700 transition-colors hover:text-blue-900 hover:underline dark:text-sky-400 dark:hover:text-sky-300"
              >
                {t('auth.forgotPassword')}
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </div>

          {error && (
            <p
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full rounded-xl bg-gradient-to-r from-blue-700 to-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 transition-all duration-200 hover:-translate-y-0.5 hover:from-blue-800 hover:to-sky-600 hover:shadow-xl disabled:translate-y-0 disabled:opacity-50 disabled:shadow-lg"
          >
            {status === 'loading' ? t('auth.signingIn') : t('auth.loginButton')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          {t('auth.noAccount')}{' '}
          <Link
            to="/register"
            className="font-semibold text-blue-700 transition-colors hover:text-blue-900 hover:underline dark:text-sky-400 dark:hover:text-sky-300"
          >
            {t('nav.register')}
          </Link>
        </p>
      </div>
    </div>
  )
}
