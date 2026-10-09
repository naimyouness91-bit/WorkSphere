import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import EmojiPicker from './EmojiPicker'

interface Props {
  disabled?: boolean
  onSend: (content: string, file?: File) => void
  onTyping: (isTyping: boolean) => void
}

export default function MessageInput({ disabled, onSend, onTyping }: Props) {
  const { t } = useTranslation()
  const [text, setText] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleTyping = () => {
    onTyping(true)
    if (typingTimeout.current) clearTimeout(typingTimeout.current)
    typingTimeout.current = setTimeout(() => onTyping(false), 2000)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if ((!text.trim() && !file) || disabled) return
    onSend(text.trim(), file ?? undefined)
    setText('')
    setFile(null)
    onTyping(false)
    setShowEmoji(false)
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
      {file && (
        <div className="mb-2 flex items-center justify-between rounded-lg bg-slate-100 px-3 py-2 text-sm dark:bg-slate-800">
          <span className="truncate">{file.name}</span>
          <button type="button" onClick={() => setFile(null)} className="text-red-600">
            ×
          </button>
        </div>
      )}
      <div className="relative flex items-end gap-2">
        <div className="relative flex flex-1 items-end gap-1 rounded-2xl border border-slate-200 bg-slate-50 px-2 py-1 dark:border-slate-600 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setShowEmoji((s) => !s)}
            className="rounded-lg p-2 text-lg hover:bg-slate-200 dark:hover:bg-slate-700"
            title={t('chat.emoji')}
          >
            😊
          </button>
          {showEmoji && (
            <EmojiPicker onSelect={(e) => setText((prev) => prev + e)} onClose={() => setShowEmoji(false)} />
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
            title={t('chat.attach')}
          >
            📎
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <textarea
            rows={1}
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              handleTyping()
            }}
            onBlur={() => onTyping(false)}
            placeholder={t('chat.placeholder')}
            className="max-h-32 flex-1 resize-none border-0 bg-transparent py-2 text-sm focus:outline-none dark:text-slate-100"
          />
        </div>
        <button
          type="submit"
          disabled={disabled || (!text.trim() && !file)}
          className="rounded-full bg-indigo-600 p-3 text-white hover:bg-indigo-700 disabled:opacity-50"
          aria-label={t('chat.send')}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </form>
  )
}
