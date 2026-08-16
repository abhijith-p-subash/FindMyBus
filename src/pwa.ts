/**
 * Service worker registration.
 *
 * Registered only in production — in dev the Vite proxy handles /api and a
 * cache layer in front of HMR causes more confusion than it is worth.
 */
export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  if (!import.meta.env.PROD) return

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      // Activate a waiting worker straight away so a deploy lands on next load.
      reg.addEventListener('updatefound', () => {
        const installing = reg.installing
        if (!installing) return
        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            installing.postMessage('SKIP_WAITING')
          }
        })
      })
    }).catch(() => {
      // A failed registration must never break the app.
    })
  })
}
