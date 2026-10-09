import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AppUser } from '../../types/userList'

interface Props {
  users: AppUser[]
  currentUserId: number
  onClose: () => void
  onCreate: (name: string, participantIds: number[]) => void
}

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900'

export default function GroupChatModal({ users, currentUserId, onClose, onCreate }: Props) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [selected, setSelected] = useState<number[]>([])

  const toggle = (id: number) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <h2 className="text-lg font-semibold">{t('chat.newGroup')}</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">{t('chat.groupName')}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">{t('chat.selectMembers')}</label>
            <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border p-2 dark:border-slate-600">
              {users
                .filter((u) => u.id !== currentUserId)
                .map((u) => (
                  <li key={u.id}>
                    <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800">
                      <input
                        type="checkbox"
                        checked={selected.includes(u.id)}
                        onChange={() => toggle(u.id)}
                      />
                      <span className="text-sm">{u.name}</span>
                    </label>
                  </li>
                ))}
            </ul>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm dark:border-slate-600">
            {t('common.cancel')}
          </button>
          <button
            type="button"
            disabled={!name.trim() || selected.length === 0}
            onClick={() => onCreate(name.trim(), selected)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {t('chat.createGroup')}
          </button>
        </div>
      </div>
    </div>
  )
}
