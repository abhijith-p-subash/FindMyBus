/* FindMyBus service worker.
 *
 * Three caches, three strategies:
 *   shell  — the app itself. Network-first for navigations so a deploy is picked
 *            up immediately, falling back to the cached shell when offline.
 *   assets — Vite's content-hashed bundles. Cache-first; the filename changes
 *            whenever the content does, so a hit is always correct.
 *   api    — the last successful reading per trip. Network-first, and on failure
 *            the cached reply is replayed with an X-FMB-Cache marker so the app
 *            can present it as last-known rather than live.
 *   tiles  — OpenStreetMap imagery, capped so it cannot grow without bound.
 */

const VERSION = 'v3'
const SHELL = `fmb-shell-${VERSION}`
const ASSETS = `fmb-assets-${VERSION}`
const API = `fmb-api-${VERSION}`

const SHELL_URLS = [
  '/',
  '/site.webmanifest',
  '/mark.svg',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(SHELL)
      // Deliberately not addAll(): that is atomic, so one 404 would reject the
      // whole batch and leave the shell cache empty — offline would break with
      // no visible symptom. Each entry is cached on its own instead.
      .then(cache =>
        Promise.allSettled(SHELL_URLS.map(url => cache.add(new Request(url, { cache: 'reload' })))),
      )
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', event => {
  const keep = new Set([SHELL, ASSETS, API])
  event.waitUntil(
    caches
      .keys()
      .then(names => Promise.all(names.filter(n => !keep.has(n)).map(n => caches.delete(n))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting()
})

/** Replay a cached API response, tagged so the UI can label it as stale. */
async function replay(response) {
  const body = await response.clone().text()
  const headers = new Headers(response.headers)
  headers.set('X-FMB-Cache', 'hit')
  return new Response(body, { status: 200, statusText: 'OK (cached)', headers })
}

async function apiStrategy(request) {
  const cache = await caches.open(API)
  try {
    const fresh = await fetch(request)
    if (fresh.ok) cache.put(request, fresh.clone())
    return fresh
  } catch (err) {
    const cached = await cache.match(request)
    if (cached) return replay(cached)
    throw err
  }
}

async function shellStrategy(request) {
  try {
    const fresh = await fetch(request)
    const cache = await caches.open(SHELL)
    cache.put('/', fresh.clone())
    return fresh
  } catch {
    const cache = await caches.open(SHELL)
    return (await cache.match(request)) || (await cache.match('/')) || Response.error()
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const hit = await cache.match(request)
  if (hit) return hit
  const fresh = await fetch(request)
  // Storage can be full or evicted; a failed write must not fail the request.
  if (fresh.ok) cache.put(request, fresh.clone()).catch(() => undefined)
  return fresh
}

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Map tiles are deliberately NOT cached here. Cross-origin tiles come back as
  // opaque responses, and the Cache API pads those to ~7 MB each for storage
  // accounting. A few hundred tiles then blow the origin's quota — which on an
  // installed iOS PWA is a smaller, separate bucket than Safari browsing, so the
  // map died in standalone while still working in the browser. Once the quota is
  // gone, cache operations start throwing and every tile request fails.
  //
  // The browser's own HTTP cache handles tiles perfectly well; OSM serves proper
  // cache headers. Leave them alone.

  if (url.origin !== self.location.origin) return

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(apiStrategy(request))
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(shellStrategy(request))
    return
  }

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request, ASSETS).catch(() => Response.error()))
    return
  }

  event.respondWith(
    fetch(request).catch(() => caches.match(request).then(r => r || Response.error())),
  )
})
