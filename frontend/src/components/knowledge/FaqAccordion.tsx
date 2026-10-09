import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { KnowledgeFaq } from '../../types/knowledge'

interface FaqAccordionProps {
  faqs: KnowledgeFaq[]
}

export default function FaqAccordion({ faqs }: FaqAccordionProps) {
  const { t } = useTranslation()
  const [openId, setOpenId] = useState<number | null>(null)

  if (faqs.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">{t('knowledge.noFaqs')}</p>
    )
  }

  return (
    <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-900">
      {faqs.map((faq) => {
        const open = openId === faq.id
        return (
          <div key={faq.id}>
            <button
              type="button"
              onClick={() => setOpenId(open ? null : faq.id)}
              className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left text-sm font-medium text-slate-900 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800/50"
            >
              <span>{faq.question}</span>
              <span
                className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
                aria-hidden
              >
                ▼
              </span>
            </button>
            {open && (
              <div className="border-t border-slate-100 px-4 pb-4 pt-2 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
                <span className="mb-2 inline-block rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  {faq.category}
                </span>
                <p className="mt-2 whitespace-pre-wrap">{faq.answer}</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
