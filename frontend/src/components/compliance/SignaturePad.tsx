import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface SignaturePadProps {
  onChange: (dataUrl: string | null) => void
  disabled?: boolean
}

export default function SignaturePad({ onChange, disabled }: SignaturePadProps) {
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [hasStroke, setHasStroke] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
    ctx.strokeStyle = '#1e3a5f'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  const getPoint = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      const touch = e.touches[0]
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return
    e.preventDefault()
    drawing.current = true
    const ctx = canvasRef.current?.getContext('2d')
    const p = getPoint(e)
    ctx?.beginPath()
    ctx?.moveTo(p.x, p.y)
  }

  const move = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current || disabled) return
    e.preventDefault()
    const ctx = canvasRef.current?.getContext('2d')
    const p = getPoint(e)
    ctx?.lineTo(p.x, p.y)
    ctx?.stroke()
    if (!hasStroke) setHasStroke(true)
  }

  const end = () => {
    if (!drawing.current) return
    drawing.current = false
    if (hasStroke && canvasRef.current) {
      onChange(canvasRef.current.toDataURL('image/png'))
    }
  }

  const clear = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasStroke(false)
    onChange(null)
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {t('compliance.signHere')}
      </p>
      <div className="rounded-xl border-2 border-dashed border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900">
        <canvas
          ref={canvasRef}
          className="h-40 w-full touch-none cursor-crosshair rounded-xl"
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={end}
        />
      </div>
      <button
        type="button"
        onClick={clear}
        disabled={disabled}
        className="text-sm font-medium text-slate-600 underline hover:text-slate-900 disabled:opacity-50 dark:text-slate-400 dark:hover:text-slate-200"
      >
        {t('compliance.clearSignature')}
      </button>
    </div>
  )
}
