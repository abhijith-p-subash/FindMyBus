# Sample trip

A shipped onboarding feature, not a test harness. A first-time visitor with no tracking link can
still see the app work.

## What the user sees

Entry points, all landing on `/track/DEMO`:

- **First run** — "No link yet? Watch a sample trip →" under the paste field
- **Desktop placeholder** — a "Try a sample trip" button beside "Add a bus"
- Typing `DEMO` into the add field also works, and is intercepted so it does not save a trip

On the tracking screen a `DemoBanner` states plainly that the data is simulated and offers
**Track a real bus** (exits and opens the add sheet) or **×** (exits to the trip list).

The simulated bus runs Kozhikode → Bengaluru via Wayanad, 21 stops, starting at stop 7 (Lakkidi).
It polls every **5s** and advances one stop every **4 polls (~20s)**, interpolating its map position
along the segment in between — so movement is visible within seconds rather than requiring a
30-second wait. Reaching Bengaluru returns `status: 302` and the real arrival screen, roughly five
minutes in.

## Isolation from real state

This is the part to preserve if you touch it. The sample trip:

- **Is never persisted.** `makeDemoTrip()` synthesises the `Trip` in `TrackPage` via `useMemo`; it
  never goes through `useTrips.addTrip`, so it cannot appear in the trip list or survive a reload.
- **Never reaches `/api`.** `useBusTracker` swaps `fetch` for `demoFetch`, so the service worker's
  `api` cache is untouched and no request hits the operator.
- **Drops `lastKnown` writes.** `onUpdateLastKnown` is a no-op, so nothing is written to
  `bus-tracker-trips-v2`.
- **Cleans up after itself.** Pinning a stop writes `bus-tracker-mystop-DEMO`; `exitDemo()` removes
  that key and calls `resetDemo()` so the next visit starts from the beginning.

The one thing it does share with the real app is the eco-mode setting, which is a genuine user
preference and intentionally global. Note that the Mode tile therefore reads `30s`/`60s` while the
demo actually polls at 5s — a known cosmetic mismatch, not a bug in the real path.

## Files

| File | Role |
| --- | --- |
| `demoApi.ts` | Route data, simulation state, `demoFetch()`, `makeDemoTrip()` |
| `DemoBanner.tsx` | The "Sample trip" banner with its two exits |

Call sites: `useBusTracker.ts` (fetch swap), `TrackingScreen.tsx` (banner + completion labels),
`App.tsx` (`startDemo`, synthetic trip, `handleAdd` interception), `FirstRun.tsx` (entry link),
`TripListScreen.tsx` (passes `onStartDemo` through).
