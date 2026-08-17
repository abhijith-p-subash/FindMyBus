import { useState } from 'react'

export function useShare(key: string, tripName: string) {
  const [copied, setCopied] = useState(false)

  const getUrl = () => `${window.location.origin}/track/${key}`
  const getText = () =>
    tripName !== key ? `🚌 ${tripName} — live on FindMyBus` : '🚌 Live bus tracking on FindMyBus'

  const share = async () => {
    const url = getUrl()
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: getText(), url, text: getText() })
      } catch {
        /* user cancelled */
      }
    } else {
      try {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch {
        /* clipboard unavailable */
      }
    }
  }

  const shareViaWhatsApp = () => {
    const text = `${getText()}\n${getUrl()}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
  }

  return { share, copied, shareViaWhatsApp }
}
