import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import SkillFiltersBar from '../components/skills/SkillFiltersBar'
import SkillFormModal from '../components/skills/SkillFormModal'
import SkillLevelBadge from '../components/skills/SkillLevelBadge'
import SkillLevelBar from '../components/skills/SkillLevelBar'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { usersApi } from '../services/usersApi'
import {
  deleteSkill,
  fetchSkills,
  openCreateSkillForm,
  openEditSkillForm,
  setSkillFilters,
} from '../store/skillsSlice'
import type { AppUser } from '../types/userList'
import { exportSkillsToExcel, exportSkillsToPdf } from '../utils/exportTrainingSkills'

export default function SkillsPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((s) => s.auth)
  const { items, status } = useAppSelector((s) => s.skills)
  const filters = useAppSelector((s) => s.skills.filters)
  const [users, setUsers] = useState<AppUser[]>([])

  const isManager = user?.role === 'admin' || user?.role === 'manager'

  useEffect(() => {
    const timer = setTimeout(() => dispatch(fetchSkills(filters)), 200)
    return () => clearTimeout(timer)
  }, [dispatch, filters])

  useEffect(() => {
    if (isManager) {
      usersApi.index().then((res) => setUsers(res.data.data))
    }
  }, [isManager])

  // Keep the employee list in sync with the signed-in user (adjust state
  // during render instead of setting it inside an effect).
  const [prevUsersKey, setPrevUsersKey] = useState(user)
  if (prevUsersKey !== user) {
    setPrevUsersKey(user)
    if (!isManager && user) {
      setUsers([{ id: user.id, name: user.name, email: user.email, role: user.role }])
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            {t('skills.title')}
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">{t('skills.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => exportSkillsToExcel(items)}
            disabled={items.length === 0}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 disabled:opacity-50"
          >
            {t('skills.exportExcel')}
          </button>
          <button
            type="button"
            onClick={() => exportSkillsToPdf(items, t('skills.exportTitle'))}
            disabled={items.length === 0}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 disabled:opacity-50"
          >
            {t('skills.exportPdf')}
          </button>
          {isManager && (
            <button
              type="button"
              onClick={() => dispatch(openCreateSkillForm())}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              {t('skills.addSkill')}
            </button>
          )}
        </div>
      </div>

      <div className="mt-6">
        <SkillFiltersBar
          filters={filters}
          users={users}
          showEmployeeFilter={isManager}
          onChange={(f) => dispatch(setSkillFilters(f))}
        />
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        {status === 'loading' ? (
          <div className="px-6 py-16 text-center text-slate-500">{t('skills.loading')}</div>
        ) : items.length === 0 ? (
          <div className="px-6 py-16 text-center text-slate-500">{t('skills.empty')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-start text-xs font-semibold uppercase text-slate-600">
                    {t('skills.name')}
                  </th>
                  <th className="px-4 py-3 text-start text-xs font-semibold uppercase text-slate-600">
                    {t('skills.employee')}
                  </th>
                  <th className="px-4 py-3 text-start text-xs font-semibold uppercase text-slate-600">
                    {t('skills.level')}
                  </th>
                  <th className="px-4 py-3 text-start text-xs font-semibold uppercase text-slate-600">
                    {t('skills.progress')}
                  </th>
                  <th className="px-4 py-3 text-end text-xs font-semibold uppercase text-slate-600">
                    {t('skills.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((skill) => (
                  <tr key={skill.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {skill.name}
                      </div>
                      {skill.description && (
                        <div className="text-xs text-slate-500 line-clamp-1">{skill.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                      {skill.employee?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <SkillLevelBadge level={skill.level} />
                    </td>
                    <td className="px-4 py-3 w-40">
                      <SkillLevelBar level={skill.level} />
                    </td>
                    <td className="px-4 py-3 text-end">
                      {isManager && (
                        <>
                          <button
                            type="button"
                            onClick={() => dispatch(openEditSkillForm(skill))}
                            className="text-sm font-medium text-indigo-600 dark:text-indigo-400"
                          >
                            {t('skills.edit')}
                          </button>
                          <button
                            type="button"
                            onClick={() => dispatch(deleteSkill(skill.id))}
                            className="ms-3 text-sm font-medium text-red-600 dark:text-red-400"
                          >
                            {t('common.delete')}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isManager && <SkillFormModal users={users} />}
    </div>
  )
}
