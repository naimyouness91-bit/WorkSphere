const EMOJIS = ['😀', '😂', '😊', '👍', '❤️', '🎉', '🔥', '✅', '👋', '🙏', '💡', '📎', '📷', '💬', '⭐', '🚀']

interface Props {
  onSelect: (emoji: string) => void
  onClose: () => void
}

export default function EmojiPicker({ onSelect, onClose }: Props) {
  return (
    <div className="absolute bottom-full start-0 z-10 mb-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-600 dark:bg-slate-800">
      <div className="grid grid-cols-8 gap-1">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className="rounded p-1 text-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            onClick={() => {
              onSelect(emoji)
              onClose()
            }}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}
