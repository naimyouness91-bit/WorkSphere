import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

interface Props {
  collapsed: boolean
  onNavigate?: () => void
}

export default function SidebarBrand({ collapsed, onNavigate }: Props) {
  const { t } = useTranslation()

  return (
    <Link
      to="/"
      className={collapsed ? 'mx-auto block' : 'flex min-w-0 flex-1 items-center gap-2.5'}
      title={t('nav.brand')}
      onClick={onNavigate}
    >
      <img
        src="/images/worksphere-logo.png"
        alt={t('auth.brandAlt')}
        className={collapsed ? 'h-9 w-9 object-contain' : 'h-10 w-10 shrink-0 object-contain'}
      />
      {!collapsed && (
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-white">
            <span className="text-sky-400">Work</span>Sphere
          </p>
          <p className="truncate text-[9px] font-medium uppercase tracking-wider text-slate-400">
            {t('auth.tagline')}
          </p>
        </div>
      )}
    </Link>
  )
}
