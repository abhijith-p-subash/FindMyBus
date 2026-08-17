# FindMyBus

Live bus tracking PWA. The user pastes a `trackingo.in` tracking URL (or bare bus code), and the app
polls that operator's API to show the bus on a map, a stop-by-stop timeline, delays, and ETAs. No
backend, no accounts — all state lives in `localStorage`.

Deployed at `https://findmybus.abhijithpsubash.com` (Netlify).

Visual system, palette, and design rationale live in `DESIGN.md`. Read it before changing anything
that has a colour, a radius, or an animation.

## Commands

```bash
npm run dev      # Vite dev server; proxies /api → bus.trackingo.in
npm run build    # tsc gate, then vite build → dist/
npm run preview  # serve dist/ locally
```

There is **no test suite and no linter**. `// eslint-disable-line` comments in `useBusTracker.ts`
and `MapPanel.tsx` are inert documentation of intentional dependency-array omissions — ESLint is not
installed. `tsc` is the only automated check; `strict`, `noUnusedLocals`, and `noUnusedParameters`
are on, so an unused import fails the build.

## Stack

React 19 · TypeScript · Vite 8 · Tailwind CSS v4 (Vite plugin, no config file) · React Router 7 ·
Leaflet · lucide-react. Fonts: Bricolage Grotesque (display), Instrument Sans (text), IBM Plex Mono
(data).

## Architecture

`App` owns three pieces of global state — `useTrips()`, `useTheme()`, `useDataSaver()` — and passes
them down as props. No context provider, no store, no data-fetching library.

```
main.tsx → BrowserRouter → App ─── registerServiceWorker()
                            ├─ TripRail          ← desktop-only master pane (hidden lg:flex)
                            ├─ AddTripSheet      ← lifted here so rail and list share it
                            └─ Routes
                               ├─ /           → ListPage  → TripListScreen (lg:hidden)
                               │                            └─ FirstRun / TripCard / EcoToggle
                               └─ /track/:key → TrackPage → TrackingScreen
                                                 ├─ useBusTracker(key) ← polls /api
                                                 ├─ useMyStop / useShare / useOnline
                                                 └─ MapPanel / HeroCard / StopTimeline
                                                    StaleBanner / MyStopBanner / CompletedState
```

**Responsive shape.** Below `lg` the trip list and tracking screen are separate full screens. From
`lg` up, `TripRail` becomes a persistent left column and the route outlet fills the rest —
master-detail. `ListPage` renders the mobile list under `lg:hidden` and a desktop placeholder under
`hidden lg:flex`, because on desktop the list already exists in the rail.

## The API

Single endpoint, hit by `useBusTracker` only:

```
GET /api/live/eta_map?current_status=true&key=<TRACKING_KEY>
```

`/api/*` is **always same-origin** — proxied to `https://bus.trackingo.in` in both environments,
which is what avoids CORS. Three places must stay in sync:

- **dev** — `server.proxy` in `vite.config.ts`
- **prod** — the `/api/*` redirect in `netlify.toml` (before the SPA catch-all, `force = true`).
  `public/_redirects` duplicates it as a fallback; `netlify.toml` wins.
- **CSP** — `connect-src 'self'` in `netlify.toml`. A call to any other host is blocked at runtime
  until that header changes too.

### Response shapes

Discriminated union on `status` (`src/types.ts`):

- `200` → `ApiResponse`, the live payload (`eta_map_data`, `current_sp_id`, `current_status_details`)
- `302` → `ApiCompleted`; the trip has finished. Timers stop, `CompletedState` renders arrival stats
  and either clears the trip after 5s or keeps it on "Keep on list".

`current_sp_id` is the stop the bus is at right now — the anchor for nearly every derived value.

## Non-obvious things worth knowing

**Stops arrive duplicated.** `eta_map_data` repeats entries for the same `service_place_name`.
`dedupeStops(stops, currentId)` collapses them by lowercased/trimmed name, always preserving the
stop matching `current_sp_id`. Any code that counts, indexes, or takes first/last **must** dedupe
first or indices won't match the rendered timeline. Several call sites dedupe independently — that
is deliberate, not redundancy.

**Deep-link cold start is synchronous.** `load()` inside `useTrips` reads `window.location.pathname`
while computing initial state and persists an unsaved `/track/:key` trip *before the first render*.
Do not convert this to a `useEffect` — that reintroduces a blank first frame on shared links.

**Colour never appears as a `light:` variant.** Every colour resolves through a CSS custom property
(`--fmb-*`) redefined under `:root.light`, exposed to Tailwind via `@theme`. So you write
`bg-surface text-ink-3 border-line` once and both themes work. **Adding a raw `zinc-*`, `violet-*`,
or `amber-*` utility breaks light mode** — add a token instead.

**The ink ramp inverts between themes.** `--fmb-ink-2` is `#D4D4D8` on dark and `#3F3F46` on light.
Tokens are named by *role* (ink-2 = secondary text), never by lightness.

**Staleness is a first-class state.** The service worker replays cached API responses with an
`X-FMB-Cache: hit` header; `useBusTracker` turns that into `stale`, which does not refresh
`lastUpdated`. `TrackingScreen` combines `stale || error || !online` into `degraded`, which
desaturates the map, dims the hero card and relabels it, and shows `StaleBanner`. Old data is never
silently presented as live.

**Polling restarts when the interval changes.** `useBusTracker`'s main effect depends on
`[key, options.refreshInterval]`, so toggling eco mode (60s) / live mode (30s) rebuilds the loop.
Callbacks are held in refs so inline arrow props do not retrigger it. The countdown restarts after
*every* attempt, success or failure, so "retrying in Ns" is accurate.

**`MapPanel` initialises Leaflet exactly once.** Map and markers live in refs, Leaflet is
dynamically imported, and separate effects handle position, frozen-marker swap, and a
`ResizeObserver` → `invalidateSize()` (needed because the panel changes size at the `lg` breakpoint).
Never let the init effect re-run.

**Leaflet escapes its container without a stacking context.** `MapPanel`'s root carries
`isolate z-0` because Leaflet assigns its panes and controls z-indexes up to 1000; with
`position: relative` alone those compete with the app's own layers and paint over the hero card,
timeline, and sticky header. Removing `isolate` reintroduces that bug.

**Icon generation cannot use ImageMagick's SVG renderer** — it silently drops stroked paths and
emits a bare amber square. The raster set is drawn with `-draw path` primitives instead. See
`DESIGN.md` §2.

## localStorage keys

| Key | Written by | Contents |
| --- | --- | --- |
| `bus-tracker-trips-v2` | `useTrips` | `Trip[]`. Migrates from `-v1` on first read, then deletes it |
| `bus-tracker-theme` | `useTheme` | `'dark'` \| `'light'` |
| `bus-tracker-data-saver` | `useDataSaver` | `'true'` \| `'false'` — eco mode |
| `bus-tracker-mystop-<KEY>` | `useMyStop` | Pinned stop id, one key per trip. Cleared by `removeTrip` |
| `bus-tracker-install-dismissed` | `useInstallPrompt` | `'true'` once the install card is dismissed |

Changing the shape of `Trip` means bumping to `-v3` and adding a migration alongside the existing
one, rather than reading old data optimistically.

## PWA

- `public/sw.js` — four caches: `shell` (network-first navigations), `assets` (cache-first,
  content-hashed), `api` (network-first, replays with `X-FMB-Cache`), `tiles` (OSM, capped at 220).
- `src/pwa.ts` — registers in production only; failures are swallowed.
- `netlify.toml` serves `/sw.js` with `max-age=0, must-revalidate` and `Service-Worker-Allowed: /`.
  Caching it would pin users to an old shell.
- Bump `VERSION` in `sw.js` when the caching strategy changes; old caches are dropped on activate.

## Sample trip (`src/demo/`)

A shipped onboarding path, not a test fixture: `/track/DEMO` runs a simulated Kozhikode → Bengaluru
bus so a first-time visitor with no tracking link still sees the app work. It polls every 5s and
advances a stop every ~20s, then hits `status: 302` and the real arrival screen.

It is deliberately walled off from real state — never persisted, never touches `/api`, `lastKnown`
writes dropped, `bus-tracker-mystop-DEMO` cleared on exit. `handleAdd` in `App.tsx` intercepts a
typed `DEMO` so it cannot become a saved trip. See `src/demo/README.md` before changing any of it.

## Input parsing

`parseTrackingKey` (`utils.ts`) accepts three forms, always uppercased:

- `https://bus.trackingo.in/customer/track_vehicle?AB1234` — bare query string, or `?key=`
- `http://trkg.in/OPERATOR/CD5678` — last path segment
- `AB1234` — bare 4–10 alphanumeric code

Anything else returns `null`. Adding an operator means extending this function *and* the `SERVICES`
array in `SupportedServices.tsx`.

## SEO / metadata

`index.html` carries hand-maintained OpenGraph, Twitter card, and JSON-LD (`WebSite` +
`SoftwareApplication` + `FAQPage`). `public/` also holds `llms.txt`, `robots.txt`, `sitemap.xml`,
`site.webmanifest`. These describe behaviour in prose and nothing validates them, so they drift
silently when the app changes.

## Known gaps

- No error boundary — a render throw in `TrackingScreen` blanks the page.
- The trip-card remove button is hover-revealed, so it is effectively invisible on touch (reachable
  by focus only). See `DESIGN.md` §11.
- No route polyline on the map; only the bus position is drawn.
- `sitemap.xml` and `llms.txt` are not generated, so they can disagree with the app.

## Conventions

- Named exports for components and hooks; `App` is the only default export.
- No semicolons, single quotes, 2-space indent.
- Components stay presentational; anything stateful or persisted becomes a hook in `src/hooks/`.
- Shared pure logic in `utils.ts`, shared shapes in `types.ts` — both dependency-free.
- Numeric display text gets `font-mono` and the `.tnum` utility so digits don't reflow.
- Section dividers (`// ─── Name ───`) separate logical groups in longer files.
