import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  onScan: (token: string) => void
}

export default function BarcodeScanner({ onScan }: Props) {
  const { t } = useTranslation()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [manual, setManual] = useState('')
  const [cameraOn, setCameraOn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const loopRef = useRef<number | null>(null)

  const stopCamera = useCallback(() => {
    if (loopRef.current) cancelAnimationFrame(loopRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setCameraOn(false)
  }, [])

  useEffect(() => () => stopCamera(), [stopCamera])

  const startCamera = async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraOn(true)

      const detector = 'BarcodeDetector' in window
        ? new (window as unknown as { BarcodeDetector: new (opts?: { formats: string[] }) => { detect: (src: ImageBitmapSource) => Promise<Array<{ rawValue: string }>> } }).BarcodeDetector({
            formats: ['qr_code', 'code_128', 'ean_13'],
          })
        : null

      const tick = async () => {
        if (!videoRef.current || !detector) {
          loopRef.current = requestAnimationFrame(tick)
          return
        }
        try {
          const codes = await detector.detect(videoRef.current)
          if (codes[0]?.rawValue) {
            onScan(codes[0].rawValue)
            stopCamera()
            return
          }
        } catch {
          /* ignore frame errors */
        }
        loopRef.current = requestAnimationFrame(tick)
      }
      loopRef.current = requestAnimationFrame(tick)
    } catch {
      setError(t('inventory.cameraDenied'))
    }
  }

  const submitManual = () => {
    const token = manual.trim()
    if (token) onScan(token)
  }

  return (
    <div className="rounded-xl border border-orange-200/60 bg-orange-50/30 p-4 dark:border-orange-900/40 dark:bg-orange-950/20">
      <h3 className="text-sm font-semibold text-orange-900 dark:text-orange-200">{t('inventory.scanTitle')}</h3>
      <p className="mt-0.5 text-xs text-slate-500">{t('inventory.scanHint')}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {!cameraOn ? (
          <button
            type="button"
            onClick={() => void startCamera()}
            className="rounded-lg bg-orange-600 px-3 py-2 text-sm text-white hover:bg-orange-700"
          >
            {t('inventory.startCamera')}
          </button>
        ) : (
          <button
            type="button"
            onClick={stopCamera}
            className="rounded-lg border px-3 py-2 text-sm dark:border-slate-600"
          >
            {t('inventory.stopCamera')}
          </button>
        )}
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {cameraOn && (
        <video ref={videoRef} className="mt-3 max-h-48 w-full rounded-lg border bg-black object-cover" muted playsInline />
      )}

      <div className="mt-3 flex gap-2">
        <input
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          placeholder={t('inventory.manualToken')}
          className="flex-1 rounded-lg border px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
        />
        <button
          type="button"
          onClick={submitManual}
          className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-white dark:bg-slate-600"
        >
          {t('inventory.lookup')}
        </button>
      </div>
    </div>
  )
}
