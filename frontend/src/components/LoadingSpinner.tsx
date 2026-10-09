interface LoadingSpinnerProps {
  label?: string
  className?: string
}

export default function LoadingSpinner({
  label = 'Loading...',
  className = '',
}: LoadingSpinnerProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 py-16 ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  )
}
