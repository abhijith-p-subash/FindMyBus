# Feature analysis: journey points and location fusion

Two proposals, analysed from the user side, the design side, and the architecture side, with the
costs stated honestly.

**Headline recommendation:** build them in the order **B0 → A → B2**, not in the order they were
proposed. Feature A costs almost nothing and delivers the most. The animation you want is
achievable without any location permission at all. Full GPS fusion is the expensive one and should
come last.

---

## 0. The constraint that shapes everything

**The API gives coordinates for the bus, and for nothing else.**

```
current_status_details.lat_long   ← the only lat/lng in the entire payload
Stop { id, service_place_name, scheduled_time, expected_time, delay_time, … }
                                   ← no coordinates, anywhere
```

Consequences, all of which are load-bearing below:

- We cannot draw the route as a polyline.
- We cannot compute "how far is the bus from my stop" in metres — only in **stops** and **minutes**.
- We cannot interpolate the marker *toward the next stop*, because we don't know where that is.
- We cannot geofence "you are at your boarding point" on the client.

### The workaround: learn stop positions by watching

Every time `current_sp_id` changes to stop *X*, the bus is by definition at stop *X* — so its
`lat_long` at that moment is a good approximation of *X*'s position. Record it.

```ts
// bus-tracker-stopgeo-v1  →  { [stopId]: { lat, lng, samples, updatedAt } }
```

After one full trip you have coordinates for most of the route; after a few, a decent average.
It costs one localStorage write per stop change, needs no extra requests, and never leaves the
device. It unlocks the polyline, real distances, and proximity alerts later.

**This is worth building early even though nothing depends on it yet**, because it only accumulates
data while people use the app. Start collecting now, use it in three months.

---

## Feature A — Boarding and destination points

> Pick where you get on and where you get off; the app tells you when to leave and when to get ready.

### User perspective

This is the feature that changes what the product *is*. Today the app answers "where is my bus".
With journey points it answers **"what should I do right now"**, which is the question people
actually have. The value is highest for the two moments that matter most:

- **Before boarding** — *"leave the house in 12 minutes"*. This is the moment the app saves you
  standing in the sun for half an hour, and it is currently unserved.
- **Before alighting** — *"get ready, 2 stops"*. Partly served by the existing pinned stop.

It also fixes a real gap: someone joining mid-route currently has no way to express "I'm not on
this bus yet."

### Design: three phases, one screen

The tracking screen has to change shape as the journey progresses. This is the actual work — the
engineering is trivial.

| Phase | Condition | Hero answers |
| --- | --- | --- |
| **Waiting** | bus has not reached the boarding stop | "Leave in 12 min" · bus reaches Vythiri at 10:20 |
| **On board** | between boarding and destination | "Sultan Bathery in 1h 12m" · 4 stops |
| **Approaching** | ≤ 2 stops from destination | Escalated card — get ready. This already exists in `MyStopBanner` |
| **Arrived** | past destination | Summary, offer to clear |

"Leave in N minutes" needs a walking allowance. **Do not solve this with routing** — that means an
external routing API, a CSP change, per-request cost, and sending the user's location to a third
party. Instead let them set it once: *"I need ___ minutes to reach the stop"*, default 10. Simple,
private, no dependencies, and the user knows their own walk better than any router.

### Tech

Storage moves from a single id to a pair:

```ts
// bus-tracker-journey-<KEY>
{ boardingId: number | null, destinationId: number | null, walkBufferMins: number }
```

Migrate `bus-tracker-mystop-<KEY>` by reading the existing pinned stop in as `destinationId` — that
is what people were already using it for.

Everything else is **derived state from data already in memory**. No new requests, no new
dependencies:

```ts
phase          = compare currentIdx against boardingIdx / destinationIdx
leaveIn        = minutesUntil(boarding.expected_time) - walkBufferMins
journeyMins    = minutesUntil(dest.expected_time) - minutesUntil(boarding.expected_time)
stopsRemaining = destinationIdx - currentIdx
```

All of it goes in `src/utils.ts` as pure functions, which also makes it the first thing worth unit
testing.

### Edge cases that will bite

1. **Boarding stop already passed** — user added the trip late, or missed the bus. Detect and say so
   plainly rather than showing a negative countdown.
2. **Destination before boarding** — validate on selection.
3. **Either stop skipped** (`stop.skipped`) — the bus is not stopping there. Must be surfaced loudly.
4. **Duplicate stop names** — `dedupeStops` already handles this, but journey ids must be taken from
   the *deduped* list or the indices will not line up.
5. **Boarding stop is the current stop** — "the bus is here, board now" is its own state.

### Cost

| | |
| --- | --- |
| Performance | **Zero.** Derived from data already fetched. |
| Battery | Zero |
| Network | Zero |
| Permissions | None |
| Privacy/legal | No change |
| Effort | ~1 day, mostly UI states |
| Risk | Low. Worst case is a confusing empty state. |

**Verdict: build this first.** Best value-to-cost ratio in the entire backlog.

---

## Feature B — Device location fusion

> Ask whether the user is on the bus; if so, use their GPS to make tracking smooth and accurate.

The instinct is sound, and the reasoning is right: **if the user is on the bus, their phone is a far
better sensor than the API.**

```
API position:    every 30s, already stale by the tracker's own lag
                 at 60 km/h, 30s = 500 m of uncertainty
Phone GPS:       ~1 Hz, 5–10 m accuracy
```

That is a one-to-two order of magnitude improvement — while on board. But the feature splits into
three phases with wildly different costs, and they should not be built together.

### B0 — Motion animation, no permission required

**This gets you the live animation you want, at almost no cost, and should be built first.**

We can't interpolate toward the next stop (no coordinates), but we can **dead-reckon from the API's
own history**: two consecutive fixes give a heading, and `speed` is in the payload. Extrapolate the
marker forward between polls and ease onto the next real fix when it lands.

```
poll t0 ──────────── extrapolate at 60 fps ──────────── poll t30
   ●  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ● ease to truth
```

Guardrails, because dead reckoning will happily drive the bus into a river:

- **Cap extrapolation** at what the reported speed allows, and stop entirely after ~40s of no fix.
- **Never jump.** Ease onto the corrected position over ~800 ms — the existing `panTo` duration.
- **Freeze when `speed === 0`**, which also stops the marker drifting while parked at a stop.
- **Stop on `visibilitychange`.** No animation for a screen nobody is looking at.

Cost: a `requestAnimationFrame` loop updating one Leaflet marker imperatively. No permission, no
battery beyond the screen already being on, no privacy implications.

### B1 — One-shot location while waiting

`MapPanel` already has a "locate me" button using `getCurrentPosition`. Extend it so that, in the
**Waiting** phase from Feature A, a single fix answers *"how far is the bus from me"*.

Blocked by the missing coordinates for now — but the stop-position learner from §0 unlocks it.

Cost: negligible. One fix on demand, user-initiated, no continuous tracking.

### B2 — Continuous on-board fusion

The expensive one.

#### Detecting "am I on the bus"

Do not rely on asking alone — people forget to tell you they got off. Do not rely on detection
alone either. **Detect, then let the user confirm or correct with one tap.**

```
onBoard ⟸  distance(user, bus) < ~75 m
       AND |speed_user − speed_bus| small
       AND both conditions hold across ≥ 2 consecutive fixes
```

The hard case: **while the bus is stopped, a person waiting at that stop looks identical to a person
sitting on the bus.** Both are within 75 m, both at 0 km/h. The only reliable discriminator is
correlated *movement* — they start moving together. So confidence should only be granted once the
bus is under way, and should decay when it is not.

Expect false positives and negatives. That is why the user gets a visible, correctable state chip
rather than a silent mode switch.

#### The real bottlenecks

**1. Battery — this is the feature's defining cost.**
Continuous `watchPosition` with `enableHighAccuracy: true` is among the heaviest things a web app
can do. On a five-hour journey it is entirely capable of consuming a large fraction of the battery
of the device the user needs to *find their way when they arrive*. Mitigations:

- Adaptive sampling: high accuracy only while moving; back off hard when stationary
- Suspend completely on `visibilitychange`
- A hard cap (e.g. auto-disable after 90 minutes, with a prompt to continue)
- An always-visible, one-tap off switch — never bury it in settings

**2. iOS backgrounding kills it.**
In an installed iOS PWA, JavaScript is suspended when backgrounded. `watchPosition` stops. Since
most people put the phone in their pocket on a bus, **the smooth-tracking benefit only exists while
the user is actively looking at the screen** — which is exactly when they need it least. This
materially reduces the feature's value and must be understood before investing in it.

**3. Permission friction.**
Location is a heavy ask. Denied once on iOS Safari, it is awkward to re-grant. Ask **only** at a
moment where the value is obvious — after the user has set a destination, not on first load.

**4. Signal loss** in tunnels, ghats, and urban canyons. Must fall back to the API position without
the UI lurching.

**5. Privacy — and this one has teeth.** See §4.

### Cost

| | |
| --- | --- |
| Performance (CPU) | Low, *if* architected per §3. Naively, severe. |
| Battery | **High. The principal cost of the feature.** |
| Network | Zero — everything client-side |
| Permissions | Location, the heaviest available |
| Privacy/legal | **Material.** See §4 |
| Effort | B0 ~half a day · B2 ~3–4 days plus real-world testing on a bus |
| Risk | Medium-high. Detection accuracy and battery complaints. |

---

## 3. The architecture question: does this hurt performance?

**Feature A: no.** **B0: no, if done with rAF.** **B2: only if built naively — but naively is the
default, so this needs deciding up front.**

### The re-render trap

Today the data path is:

```
useBusTracker (every 30 s) → setState → TrackingScreen re-renders → ~21 timeline rows re-render
```

At 30-second intervals that is free. At 1 Hz GPS plus 60 fps animation, the same pattern would
re-render the entire timeline sixty times a second. On a mid-range Android that is jank, and on a
bus it is battery burned for nothing.

### The fix: keep high-frequency data out of React

```
GPS / rAF position ──► useRef ──► marker.setLatLng()        imperative, no render
                          │
                          └────► throttled to 1 Hz ──► <LiveSpeed/>   isolated leaf component
                                                       └─ memoised, re-renders alone

API poll (30 s) ─────► setState ──► timeline, hero card    unchanged, low frequency
```

Three rules:

1. **Position never enters React state.** It lives in a ref and drives Leaflet directly. Leaflet is
   already imperative — `MapPanel` holds its map and markers in refs precisely for this reason.
2. **Only the speed readout subscribes** to high-frequency updates, as its own memoised component,
   throttled to 1 Hz. Nothing else re-renders.
3. **The timeline never re-renders from position.** It depends on `current_sp_id`, which changes
   every few minutes at most.

Done this way, B2 costs roughly one `setLatLng` per frame — cheap. Done naively it will be the
slowest screen in the app.

### A prerequisite bug worth fixing first

Background timers are throttled or suspended by the browser, so **after the app has been
backgrounded the displayed data is older than the countdown claims.** There is an `online` listener
but no `visibilitychange` one. Before adding anything that depends on freshness:

```ts
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') refresh()
})
```

Small fix, and both features assume it.

---

## 4. Privacy and legal impact — read before building B

`doc/LEGAL.md` §6 documents the current position: saved trips never leave the device, but tracking
requests pass through our Netlify proxy. Adding location changes the picture.

**Precise device location is personal data under the DPDP Act, 2023, and is more sensitive than
anything the app currently touches.**

The design rule that keeps this safe is simple and absolute:

> **User location must never leave the device.** All fusion, distance, and ETA maths runs
> client-side. It is never sent to the proxy, never logged, never included in a share link.

Two things make this credible rather than aspirational:

1. **The CSP already enforces it.** `connect-src 'self'` means the page structurally cannot post
   location to a third party. That is an architectural guarantee, not a promise — worth stating
   plainly to users, and worth never weakening.
2. **There is no backend.** There is nowhere for it to go.

If B ships, these must all be updated in the same change:

- `README.md` privacy section
- `public/llms.txt`
- the JSON-LD FAQ in `index.html`
- `AppFooter` — the in-app disclosure
- `doc/LEGAL.md` §6 and the §7 mitigations table

Plus, in-product: a plain statement at the permission prompt of what is collected and where it goes
(nowhere), and an always-reachable off switch. **Never** enable location by default.

---

## 5. Recommended sequence

| Order | What | Effort | Why here |
| --- | --- | --- | --- |
| 1 | `visibilitychange` refresh | 30 min | Prerequisite; fixes an existing staleness bug |
| 2 | **Feature A** — journey points | ~1 day | Highest value, zero cost, no permissions |
| 3 | Stop-position learner (§0) | ~half day | Passive; starts accumulating data now, unlocks later work |
| 4 | **B0** — dead-reckoning animation | ~half day | The animation you want, no permission, no battery |
| 5 | Route polyline | ~half day | Becomes possible once §0 has data |
| 6 | **B1** — one-shot distance to bus | ~half day | Cheap, user-initiated |
| 7 | **B2** — continuous fusion | 3–4 days + field testing | Only after the above prove the value |

Steps 1–4 deliver most of the perceived benefit of both proposals for roughly two days of work, no
permission prompts, and no privacy exposure at all.

**Step 7 deserves a genuine decision, not momentum.** Given that iOS suspends it in the background —
where a bus passenger's phone spends most of its time — the honest question is whether continuous
fusion earns its battery cost and its privacy surface. It may well be that B0 plus Feature A is the
right final answer, and B2 never needs building.
