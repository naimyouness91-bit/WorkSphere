import type { SVGProps } from 'react'

interface Props extends SVGProps<SVGSVGElement> {
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: { icon: 'h-8 w-8', text: 'text-base' },
  md: { icon: 'h-10 w-10', text: 'text-xl' },
  lg: { icon: 'h-12 w-12', text: 'text-2xl' },
}

export default function WorkSphereLogo({ showText = true, size = 'md', className = '' }: Props) {
  const s = sizes[size]

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className={`${s.icon} flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-indigo-700 shadow-lg shadow-indigo-500/25`}
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-[55%] w-[55%] text-white" aria-hidden>
          <path
            d="M12 3L4 8v8l8 5 8-5V8l-8-5z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="2.5" fill="currentColor" />
        </svg>
      </div>
      {showText && (
        <span className={`font-bold tracking-tight ${s.text}`}>
          <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-violet-400">
            WorkSphere
          </span>
        </span>
      )}
    </div>
  )
}
