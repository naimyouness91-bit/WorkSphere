import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBookOpen,
  faChartBar,
  faFileAlt,
  faMoneyBillWave,
} from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'

const features: {
  key: 'requests' | 'training' | 'payroll' | 'analytics'
  icon: IconDefinition
  path: string
  accent: string
}[] = [
  {
    key: 'requests',
    icon: faFileAlt,
    path: '/requests',
    accent: 'from-indigo-500 to-indigo-600 shadow-indigo-500/30',
  },
  {
    key: 'training',
    icon: faBookOpen,
    path: '/training',
    accent: 'from-violet-500 to-violet-600 shadow-violet-500/30',
  },
  {
    key: 'payroll',
    icon: faMoneyBillWave,
    path: '/payroll',
    accent: 'from-amber-500 to-orange-600 shadow-amber-500/30',
  },
  {
    key: 'analytics',
    icon: faChartBar,
    path: '/reports',
    accent: 'from-emerald-500 to-teal-600 shadow-emerald-500/30',
  },
]

export default function HomeFeatureCards() {
  const { t } = useTranslation()

  return (
    <section className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
      {features.map((feature, i) => (
        <Link
          key={feature.key}
          to={feature.path}
          className="animate-fade-in-up group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-indigo-800"
          style={{ animationDelay: `${150 + i * 50}ms` }}
        >
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${feature.accent} text-lg text-white shadow-md transition-transform duration-200 group-hover:scale-105`}
          >
            <FontAwesomeIcon icon={feature.icon} className="h-5 w-5" aria-hidden />
          </div>
          <h3 className="mt-4 font-semibold text-slate-900 dark:text-slate-100">
            {t(`home.features.${feature.key}Title`)}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {t(`home.features.${feature.key}Desc`)}
          </p>
        </Link>
      ))}
    </section>
  )
}
