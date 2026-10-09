import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AuthBrandHeader from '../components/auth/AuthBrandHeader'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { clearError, register } from '../store/authSlice'
import { getDashboardPath } from '../utils/roles'

const inputClass =
  'mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-indigo-400'

export default function RegisterPage() {
  const { t, i18n } = useTranslation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { status, error } = useAppSelector((state) => state.auth)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    dispatch(clearError())
    const locale = i18n.language.split('-')[0] as 'en' | 'fr' | 'ar'
    const result = await dispatch(
      register({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
        locale,
      }),
    )
    if (register.fulfilled.match(result)) {
      navigate(getDashboardPath(result.payload.user.role))
    }
  }

  return (
    <div className="animate-fade-in-up w-full max-w-md">
      <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-xl shadow-indigo-500/10 backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/95 sm:p-8">
        <AuthBrandHeader compact />

        <h1 className="mt-6 text-center text-xl font-bold text-slate-900 dark:text-slate-100">
          {t('auth.registerTitle')}
        </h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('auth.name')}
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </div>
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
              {t('auth.password')}
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
            disabled={status === 'loading'}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50"
          >
            {status === 'loading' ? t('auth.signingUp') : t('auth.signUp')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          {t('auth.hasAccount')}{' '}
          <Link to="/login" className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
            {t('auth.loginButton')}
          </Link>
        </p>
      </div>
    </div>
  )
}
