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
- **Shareable links** — send `…/track/AB1234` and the recipient sees the same bus, no account needed
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
browser ──► /api/live/eta_map?key=AB1234 ──► proxy ──► bus.trackingo.in
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

## What this is, and what it isn't

**FindMyBus does not track buses.** It has no vehicle data, no route database, and no relationship
with any bus operator. It is worth being precise about this, because it is the whole design.

Bus operators already track their vehicles using **Trackingo**, a product of
[Bitla Software Pvt. Ltd.](http://trackingo.in/) When you book, the operator sends you a tracking
link or a code like `AB1234`. That code exists so that *you* can watch *your* bus — you are already
entitled to see it.

The problem is the screen you land on. The information is there, but it is hard to read on a phone,
slow to make sense of, and doesn't answer the one question you actually have.

So FindMyBus is **a different front-end for a service you already have access to**:

```
operator gives you a code  ──►  you paste it into FindMyBus  ──►  FindMyBus asks Trackingo
                                                                   for that one trip and draws it
```

It requests **one trip, for one user, from a code that user supplied**, at most once every 30
seconds. It stores nothing on a server, aggregates nothing, and redistributes nothing. The nearest
comparison is a reader-mode extension or an accessibility tool: it acts for a user who already has
permission, on data they were already being shown.

Everything good about the data comes from Trackingo. Everything about how it is presented is this
project.

### Not affiliated with Bitla Software

> FindMyBus is an independent, unofficial project. It is **not affiliated with, endorsed by, or
> connected to Bitla Software Pvt. Ltd. or Trackingo.** "Trackingo" and "Bitla" are the property of
> their respective owners and are used here only to describe what this app is compatible with.
>
> Live bus data is provided by, and belongs to, Bitla Software. This project claims no rights over
> it. **If Bitla asks us to stop, we will stop immediately** — contact
> [abhijith.p.subash@gmail.com](mailto:abhijith.p.subash@gmail.com) or open an issue.

### If you are forking or self-hosting

Please read [`doc/LEGAL.md`](doc/LEGAL.md) first. It sets out the analysis under **Sections 43 and
66 of the IT Act, 2000**, and the commitments that keep the position defensible. In short:

- **Never lower the 30s / 60s polling floor.** Aggregate load is the realistic route to a
  Section 43(f) disruption argument.
- **Only ever request codes a user has supplied.** No enumeration, no guessing, no crawling.
- **Never monetise it.** No revenue means no wrongful gain, which is what keeps this well clear of
  Section 66.
- **If an API key or any access control ever appears, stop.** Do not work around it.
- **Never imply partnership or endorsement.**

None of this is legal advice, and none of it has been reviewed by a lawyer. If you deploy this
publicly, get your own advice.

## Privacy — stated accurately

Two different things, and it is worth not blurring them:

**Stays on your device, always.** Your saved trips, names, pinned stops, and theme live in your
browser's `localStorage` and are never transmitted anywhere. There are no accounts, no cookies, no
analytics, and no third-party scripts.

**Passes through our proxy.** Live tracking requests go `browser → /api/* → Netlify → Trackingo`,
because a browser cannot call Trackingo directly without hitting CORS. **That proxy is our
infrastructure and it sees each request** — your IP address, your user agent, and the tracking code
in the URL. Netlify keeps standard access logs. We do not read them, build profiles, or retain
anything ourselves, but it would be untrue to claim the request never reaches a server of ours.

Map tiles are fetched directly by your browser from the OpenStreetMap tile servers, which see your
IP for the same unavoidable reason.

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
