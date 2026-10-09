import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { inventoryApi } from '../../services/inventoryApi'

export default function ItemQrCode({ itemId }: { itemId: number }) {
  const { t } = useTranslation()
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    let url: string | null = null
    inventoryApi
      .qrSvg(itemId)
      .then((res) => {
        url = URL.createObjectURL(res.data)
        setSrc(url)
      })
      .catch(() => setSrc(null))

    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [itemId])

  if (!src) {
    return <p className="text-xs text-slate-500">{t('inventory.qrLoading')}</p>
  }

  return (
    <img
      src={src}
      alt={t('inventory.qrAlt')}
      className="h-32 w-32 rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-600"
    />
  )
}
