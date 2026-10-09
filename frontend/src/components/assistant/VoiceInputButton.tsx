import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  onTranscript: (text: string) => void
  disabled?: boolean
}

export default function VoiceInputButton({ onTranscript, disabled }: Props) {
  const { t } = useTranslation()
  const [listening, setListening] = useState(false)
  const [supported] = useState(
    () => typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition),
  )
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return

    const recognition = new SR()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = document.documentElement.lang || 'en-US'

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0]?.[0]?.transcript
      if (transcript) onTranscript(transcript.trim())
      setListening(false)
    }

    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)

    recognitionRef.current = recognition
  }, [onTranscript])

  const toggle = useCallback(() => {
    const recognition = recognitionRef.current
    if (!recognition) return

    if (listening) {
      recognition.stop()
      setListening(false)
      return
    }

    setListening(true)
    recognition.start()
  }, [listening])

  if (!supported) return null

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled}
      title={t('assistant.voiceInput')}
      className={[
        'rounded-lg p-2 transition-all duration-200',
        listening
          ? 'animate-pulse bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300'
          : 'text-slate-500 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-700 dark:hover:text-indigo-400',
        disabled ? 'opacity-50' : '',
      ].join(' ')}
      aria-label={t('assistant.voiceInput')}
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
        />
      </svg>
    </button>
  )
}
