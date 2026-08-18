import { useEffect, useState, useCallback } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'bus-tracker-install-dismissed'

/**
 * How this browser can install the app.
 *
 *  prompt  Chromium — `beforeinstallprompt` fired and we can open the native sheet
 *  ios     iOS/iPadOS Safari — no API at all, only "Share → Add to Home Screen"
 *  safari  macOS Safari — no API either, but it has "File → Add to Dock"
 *  null    already installed, dismissed, or genuinely not installable
 */
export type InstallMode = 'prompt' | 'ios' | 'safari' | null

function detect() {
  const ua = navigator.userAgent
  // iPadOS 13+ reports itself as Macintosh; touch points are what give it away.
  const isIPad = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1
  const isIOS = /iPad|iPhone|iPod/.test(ua) || isIPad
  const isSafari = /^((?!chrome|android|crios|fxios|edg|opr).)*safari/i.test(ua)
  return { isIOS, isMacSafari: !isIOS && /Macintosh/.test(ua) && isSafari }
}

export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISSED_KEY) === 'true')

  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as { standalone?: boolean }).standalone === true

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferred(null)
    }

    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const install = useCallback(async () => {
    if (!deferred) return
    await deferred.prompt()
    const { outcome } = await deferred.userChoice
    if (outcome === 'accepted') setInstalled(true)
    setDeferred(null)
  }, [deferred])

  const dismiss = useCallback(() => {
    setDismissed(true)
    try {
      localStorage.setItem(DISMISSED_KEY, 'true')
    } catch {}
  }, [])

  let mode: InstallMode = null
  if (!installed && !standalone && !dismissed) {
    const { isIOS, isMacSafari } = detect()
    if (deferred) mode = 'prompt'
    else if (isIOS) mode = 'ios'
    else if (isMacSafari) mode = 'safari'
  }

  return { mode, install, dismiss }
}
