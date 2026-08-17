<div align="center">

<img src="public/icon.svg" width="88" height="88" alt="FindMyBus">

# findmybus

**Live bus tracking that answers one question: where is my bus right now?**

Real-time position on a map, stop-by-stop timeline, delay trends and ETAs.
Installable, works offline with last-known data, and needs no account.

[![CI](https://github.com/abhijith-p-subash/FindMyBus/actions/workflows/ci.yml/badge.svg)](https://github.com/abhijith-p-subash/FindMyBus/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-FFB020.svg)](LICENSE)
[![PWA](https://img.shields.io/badge/PWA-installable-FFB020.svg)](#pwa)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-4ADE80.svg)](CONTRIBUTING.md)

[**Live app**](https://findmybus.abhijithpsubash.com) · [Try the sample trip](https://findmybus.abhijithpsubash.com/track/DEMO) · [Architecture](doc/ABOUT.md) · [Design system](doc/DESIGN.md)

</div>

---

## What it does

You paste the tracking link your bus operator sent you. FindMyBus turns it into a live view:

- **Next stop and minutes away**, as the headline figure — not raw coordinates
- **Live position on an OpenStreetMap map**, with your own location alongside it
- **Stop-by-stop timeline** with arrival times, delays, and which stop the bus is at now
- **Pin your destination** and see how many stops away the bus is; the card escalates when it's close
- **Delay trend** across polls — is the delay recovering or growing?
- **Honest staleness.** When the connection drops, the map desaturates, the card relabels to
  *last known*, and a banner states exactly how old the data is. Old readings are never dressed up
  as live.
- **Shareable links** — send `…/track/YE0407` and the recipient sees the same bus, no account needed
- **Dark and light themes**, and `prefers-reduced-motion` is respected

No sign-up, no ads, no analytics. Every trip you save lives in your own browser's `localStorage`
and never reaches a server.

### No tracking link handy?

Open [`/track/DEMO`](https://findmybus.abhijithpsubash.com/track/DEMO) for a simulated
Kozhikode → Bengaluru service that advances stop by stop while you watch. It's fully isolated from
real state — nothing is saved, and no request leaves the browser.

---

## Quick start

```bash
git clone https://github.com/abhijith-p-subash/FindMyBus.git
cd FindMyBus
npm install
npm run dev
```

Open the printed URL. Node 20 or newer (`.nvmrc` pins 20).

There is **no environment configuration and no API key** — the dev server proxies `/api` to the
upstream tracker for you.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with the `/api` proxy |
| `npm run build` | Typecheck, then production build to `dist/` |
| `npm run preview` | Serve the built output locally |
| `npm run lint` | ESLint |
| `npm run format` | Apply Prettier |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run verify` | Everything CI runs — do this before opening a PR |

---

## How it works

No backend. The whole app is static files plus a same-origin proxy.

```
browser ──► /api/live/eta_map?key=YE0407 ──► proxy ──► bus.trackingo.in
   │                                          (Vite in dev, Netlify redirect in prod)
   ├── localStorage ......... saved trips, theme, pinned stops
   └── service worker ....... app shell, hashed assets, last-known reading, map tiles
```

React 19 · TypeScript · Vite 8 · Tailwind CSS v4 · React Router 7 · Leaflet.

State is three hooks in `App` — `useTrips`, `useTheme`, `useDataSaver` — passed down as props. No
store, no context provider, no data-fetching library. Full details, including the traps worth
knowing before you change anything, are in **[doc/ABOUT.md](doc/ABOUT.md)**.

### PWA

Installable on Android, desktop Chrome, and iOS via *Share → Add to Home Screen*. The service worker
keeps four caches: the app shell, content-hashed assets, the last successful reading per trip, and
map tiles (capped). A cold offline open still shows where the bus last was, clearly marked as stale.

### Design

The visual system — amber `#FFB020` for live state, coral for delay, a three-typeface hierarchy,
and a token layer that makes light mode a variable swap rather than per-element overrides — is
documented in **[doc/DESIGN.md](doc/DESIGN.md)**. Read it before touching anything with a colour,
radius, or animation in it.

---

## A note on the data source

FindMyBus reads an **undocumented endpoint** belonging to `bus.trackingo.in`. This is not an
official partnership or a sanctioned API, and there is no agreement with the operator. Practical
consequences you should know before depending on this:

- The endpoint can change or disappear without warning, and the app will break when it does.
- Only buses already tracked by trackingo.in can be tracked here. FindMyBus adds no data of its own.
- The proxy exists to avoid browser CORS restrictions, not to hide or disguise traffic. Requests
  reach the operator exactly as the browser made them.
- Polling defaults to 30s, with a 60s eco mode. **Please don't lower these in a fork** — the point
  is to stay well inside courteous usage of someone else's server.

If you represent trackingo.in and would like something changed, please
[open an issue](https://github.com/abhijith-p-subash/FindMyBus/issues) — it will be actioned.

Map tiles come from the OpenStreetMap public tile servers, subject to their
[Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/). A production fork with
real traffic should move to a proper tile provider.

---

## Deploying

The repo is configured for **Netlify** out of the box (`netlify.toml`): build command, SPA fallback,
the `/api` proxy, security headers with a strict CSP, and cache rules.

Any static host works, but you must reproduce two things or the app will not function:

1. **A same-origin proxy** mapping `/api/*` → `https://bus.trackingo.in/api/*`. Without it every
   request fails CORS.
2. **An SPA fallback** rewriting unmatched paths to `/index.html`, or shared `/track/:key` links
   will 404 on a cold load.

If you add a host, remember `connect-src 'self'` in the CSP — calls to any other origin are blocked
until that header changes too.

---

## Contributing

Contributions are welcome, and small ones especially. Good first areas:

- **Support another operator** — extend `parseTrackingKey` in `src/utils.ts` and the service list
- **Route polyline on the map** — only the bus position is drawn today
- **Arrival notifications** when the bus is N stops from your pinned stop
- **Accessibility** — a high-contrast outdoor mode is sketched in `doc/DESIGN.md` §9.1

Read **[CONTRIBUTING.md](CONTRIBUTING.md)** first; it covers the conventions that will otherwise
trip you up, notably the design-token rule and the duplicate-stops quirk in the upstream data.
Please also read the [Code of Conduct](CODE_OF_CONDUCT.md).

## Security

Found a vulnerability? Please don't open a public issue — see [SECURITY.md](SECURITY.md).

## Licence

[MIT](LICENSE) © Abhijith P Subash

Map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors. Icons by
[Lucide](https://lucide.dev). Typefaces: Bricolage Grotesque, Instrument Sans, IBM Plex Mono.

<div align="center">

If FindMyBus saved you a wait at a bus stop, [buy me a coffee](https://buymeacoffee.com/abhijithpsubash) ☕

</div>
