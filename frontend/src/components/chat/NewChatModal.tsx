import { useTranslation } from 'react-i18next'
import type { AppUser } from '../../types/userList'

interface Props {
  users: AppUser[]
  currentUserId: number
  onClose: () => void
  onSelect: (userId: number) => void
}

export default function NewChatModal({ users, currentUserId, onClose, onSelect }: Props) {
  const { t } = useTranslation()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <h2 className="text-lg font-semibold">{t('chat.newChat')}</h2>
        <ul className="mt-4 max-h-64 space-y-1 overflow-y-auto">
          {users
            .filter((u) => u.id !== currentUserId)
            .map((u) => (
              <li key={u.id}>
                <button
                  type="button"
                  onClick={() => onSelect(u.id)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-start hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                    {u.name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="text-sm font-medium">{u.name}</span>
                </button>
              </li>
            ))}
        </ul>
        <button type="button" onClick={onClose} className="mt-4 w-full rounded-lg border py-2 text-sm dark:border-slate-600">
          {t('common.cancel')}
        </button>
      </div>
    </div>
  )
}
