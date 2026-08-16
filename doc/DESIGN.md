# FindMyBus — Design Document

Sections 1–8 describe the system as built. Sections 9–11 are proposals and open questions.

Superseded: the pre-redesign identity (violet `#7C3AED` accent, stock bus mark, single Inter
typeface, `light:` twin classes). Nothing in the codebase uses it any more.

---

## 1. Product identity

FindMyBus answers one question, repeatedly, under bad conditions: **"where is my bus right now?"**

The usage context drives everything:

- **One-handed, on a phone, often outdoors.** Glanceable beats comprehensive.
- **Poor connectivity is normal.** Stale data must degrade visibly, never blank out.
- **The session is short and anxious.** The user is waiting, possibly late.
- **Frequently arrived at via a shared link**, with zero prior context and no account.

The posture that follows: **a live instrument, not a document.** Closer to a departure board than a
travel app — dense with real numbers, quiet in ornament, honest about staleness.

**Voice.** Terse and factual. `On time`, `+12m`, `4 stops away`, `HERE`. Lowercase wordmark. No
exclamation marks in the data path. Warmth is confined to first run and the arrival moment.

---

## 2. Brand

### The mark

An **amber tile carrying a monoline lowercase "f"**. It is drawn as geometry — two stroked paths,
no type — so it renders identically before webfonts load, at 16px in a browser tab, and when
rasterised to PNG.

| Asset | Purpose |
| --- | --- |
| `public/icon.svg` | Source of truth. Rounded tile, `rx=152` on a 512 canvas. |
| `icon-192.png`, `icon-512.png` | Manifest `purpose: any` |
| `icon-maskable-512.png` | Manifest `purpose: maskable` — full-bleed, no rounding; the platform applies its own shape |
| `apple-touch-icon.png` | 180×180, opaque (iOS composites no alpha) |
| `favicon.ico` | 48/32/16 multi-size |
| `og-image.png` | 1200×630 social card |
| `src/components/Logo.tsx` | The same geometry as inline SVG, using theme tokens so it inverts with the palette |

Regenerate the raster set with the scripts under the session scratchpad, or by re-running
ImageMagick against `icon.svg`. Note that **ImageMagick's built-in SVG renderer silently drops
stroked paths** — the generation script draws with `-draw path` primitives instead, which is why it
exists rather than a one-line `magick icon.svg out.png`.

### The wordmark

`findmybus` — one word, all lowercase, Bricolage Grotesque Semibold, `letter-spacing: -0.02em`.
Lowercase is deliberate: it reads as a utility, not a brand.

---

## 3. Colour

Dark-first. **Light mode is a token swap, not a per-element override** — every colour resolves
through a CSS custom property redefined under `:root.light`, so components carry no `light:`
variants at all.

### 3.1 Ground and ink

| Token | Dark | Light | Role |
| --- | --- | --- | --- |
| `--fmb-canvas` | `#08080A` | `#F4F4F5` | Backdrop behind modals |
| `--fmb-bg` | `#0B0B0D` | `#FAFAFA` | App ground |
| `--fmb-surface` | `#131316` | `#FFFFFF` | Cards, raised chrome |
| `--fmb-surface-2` | `#101013` | `#FAFAFA` | Recessed rows, quiet cards |
| `--fmb-surface-3` | `#0E0E11` | `#F4F4F5` | Tiles inside cards, map ground |
| `--fmb-line` | `#26262B` | `#E4E4E7` | Default border |
| `--fmb-line-strong` | `#2A2A30` | `#D4D4D8` | Emphasised border, hover |
| `--fmb-line-soft` / `-faint` | `#1E1E22` / `#1A1A1E` | `#E9E9EC` / `#F1F1F3` | Dividers, dim cards |
| `--fmb-ink` | `#FAFAFA` | `#18181B` | Primary text |
| `--fmb-ink-2` | `#D4D4D8` | `#3F3F46` | Secondary |
| `--fmb-ink-3` | `#A1A1AA` | `#71717A` | Body meta |
| `--fmb-ink-4` | `#71717A` | `#A1A1AA` | Labels, eyebrows |
| `--fmb-ink-5` | `#52525B` | `#D4D4D8` | Faintest — hairlines, disabled |

Note the ink ramp **inverts** between themes (`ink-2` is light-on-dark and dark-on-light). That is
the whole reason the token layer exists.

### 3.2 Semantic colour

Three hues carry the entire information payload.

| Token | Value | Meaning |
| --- | --- | --- |
| **Signal** `--fmb-signal` | `#FFB020` | Live state, current position, primary action. **The brand colour.** |
| — `--fmb-signal-text` | `#FFB020` dark / `#B27700` light | Amber on white fails contrast; text steps down, fills do not |
| — `--fmb-signal-ink` | `#0B0B0D` | Text placed *on* amber |
| — `--fmb-signal-wash` / `-edge` | 14–18% / 28–32% | Tinted fills and borders |
| **Delay** `--fmb-delay` | `#FF6B4A` | Lateness and errors, nothing else |
| — `--fmb-delay-text` | `#FF6B4A` dark / `#C2410C` light | |
| **Go** `--fmb-go` | `#4ADE80` | On time, arrived, healthy |
| — `--fmb-go-text` | `#4ADE80` dark / `#15803D` light | |

Blue (`#3B82F6`) appears in exactly one place: the user's own position marker on the map. Amber is
the bus, blue is you. That separation is load-bearing and must be protected.

### 3.3 Rules

1. **Signal is rationed.** It means "live and current" — the bus position, the current stop, the
   primary action, the pinned destination. Never decorative.
2. **Status colour never becomes a large fill.** Icons, text, 1px borders, and ≤18% washes only.
3. **Opacity expresses sequence, not colour.** Past timeline stops are `opacity-45` on identical
   markup. Adding a hue for "past" would be a mistake.
4. **Delay ≠ warning-yellow.** Amber is taken by liveness, so lateness moved to coral. Do not
   reintroduce a yellow for delay — it will read as "live".
5. **No surface gradients.** The only gradients are the timeline connector, the map fade, the
   imminent-stop card, and the skeleton shimmer.

---

## 4. Typography

Three voices, each with one job:

| Role | Family | Used for |
| --- | --- | --- |
| **Display** | Bricolage Grotesque 500/600/700 | Screen titles, stop names, trip names, the big figures' companions |
| **Text** | Instrument Sans 400/500/600 | Body, labels, buttons, everything conversational |
| **Data** | IBM Plex Mono 400/500/600 | Every time, delay, countdown, code, and eyebrow label |

Rules that fall out of this:

- **Anything numeric is mono and `tnum`.** The `.tnum` utility is mandatory on ticking figures —
  digits must not reflow between polls.
- **Eyebrow labels are a single style**, encoded as `.eyebrow`: mono 500, 10px, `0.16em` tracking,
  uppercase, `ink-4`. `NEXT STOP`, `TIMELINE`, `WORKS WITH`, `DELAY`.
- **Display carries tight negative tracking** — `-0.02em` to `-0.035em`, scaling with size.
- **Hierarchy is weight and family, not size.** Body sits at 13–15px throughout; only hero figures
  (26–40px) and screen titles (30–40px) break out.

---

## 5. Shape, depth, layout

- **Radius ladder** (tokens, not ad-hoc values): `badge` 8 · `chip` 10 · `ctl` 12 · `field` 14 ·
  `tile` 16 · `card` 22 · `hero` 26 · `sheet` 32.
- **Elevation is borders**, not shadows. Shadows appear only on the hero card, the add sheet, the
  share dropdown, and the floating jump button.
- **Controls are 36×36** (`w-9 h-9`) with 12px radius.
- **Phone column** is `max-w-2xl` with `px-4`/`px-5`. The map runs edge-to-edge and dissolves into
  the page; the hero card overlaps it by `-mt-10`.
- **Viewport** uses `min-h-dvh` plus `env(safe-area-inset-*)` via `.pb-safe` / `.pt-safe`.

### Responsive structure

| Breakpoint | Layout |
| --- | --- |
| `< lg` | Single column. Trip list and tracking are separate full screens with direction-aware slide transitions. Map is edge-to-edge. |
| `≥ lg` | **Two-pane master-detail.** `TripRail` becomes a persistent 340–380px left column (sticky, own scroll); the route outlet fills the rest. Map becomes a contained rounded panel. `/` renders a placeholder in the detail pane rather than repeating the list. |

The rail is `hidden lg:flex` — one component, no JS media queries. `MapPanel` runs a
`ResizeObserver` and calls Leaflet's `invalidateSize()` so crossing the breakpoint doesn't leave a
half-rendered map.

---

## 6. Motion

One curve governs almost everything: **`cubic-bezier(0.22, 1, 0.36, 1)`**, durations 220–280ms.

| Animation | Duration | Purpose |
| --- | --- | --- |
| `view-in` | 220ms | Banners, dropdowns |
| `card-in` | 250ms | Trip cards, staggered 55ms per index |
| `slide-in-right/left` | 250ms | Direction-aware route transitions |
| `sheet-in` | 280ms | Add-trip sheet |
| `arrive-in` | 580ms | Arrival only — `cubic-bezier(0.34, 1.56, 0.64, 1)`, the one overshoot |
| `soft-blink` | 2s loop | Live status dots |
| `pulse-ring` | 2s loop | Map marker halo |
| `shimmer` | 1.4s loop | Skeleton |

**Motion signals liveness or direction, never delight.** The only celebratory animation is arrival,
the one moment the user's task is actually over.

`prefers-reduced-motion: reduce` is honoured globally: all durations collapse, iteration counts drop
to 1, and the three infinite loops stop outright. Liveness then reads from the countdown and
timestamp, both already on screen.

---

## 7. Component patterns

- **Hero card** — the answer. Next stop in display type, minutes-away as a 40px mono figure in
  signal, a 5px progress bar with `stop n / total`, then three tiles: delay (with trend), arrival
  clock, refresh mode. The mode tile is a button — it toggles eco.
- **Stat tile** — `rounded-tile`, `surface-3`, 1px border, eyebrow label above a mono value.
- **Status pill** — `rounded-[7px]`, tinted wash, mono 9px, `0.12em` tracking. `HERE`, `NEXT`.
- **Contextual banner** — `rounded-tile`, tinted, icon chip + two-line body + trailing action.
  `StaleBanner` and `MyStopBanner`.
- **Timeline row** — 14px rail column (dot + 2px connector) beside flexible content. Dot encodes
  state: 12px filled + ring = current; 11px **rotated square** = your stop; 9px hollow = upcoming;
  8px solid = passed. The connector below the current stop is an amber→line gradient.
- **Trip card** — status dot + mono uppercase label, display-type route name, mono code chip,
  hairline divider, then position and delay.

---

## 8. PWA

- **Installable**: manifest with `id`, `scope`, `display_override`, maskable icon, and an
  "Add a bus" shortcut targeting `/?add=1` (handled in `App`).
- **Install affordance**: `useInstallPrompt` captures `beforeinstallprompt` on Chromium. iOS Safari
  fires nothing and exposes no API, so it gets the manual "Share → Add to Home Screen" instruction
  instead. Dismissal is remembered.
- **Service worker** (`public/sw.js`), four caches:
  - `shell` — network-first navigations, cached `/` fallback offline.
  - `assets` — cache-first for `/assets/*` (content-hashed, so a hit is always correct).
  - `api` — network-first; on failure the last successful reply is replayed with an
    **`X-FMB-Cache: hit`** header. `useBusTracker` reads that header and marks the payload stale
    rather than presenting it as live.
  - `tiles` — OSM imagery, capped at 220 entries.
- **Staleness is a designed state, not an error.** When data is stale the map desaturates and gains
  a `frozen · HH:MM` chip, the hero card drops to 75% and relabels to `LAST NEXT STOP` / `est. min`,
  and `StaleBanner` states the exact age and the retry countdown. Trust in a live tracker is built
  by admitting when it isn't live.
- Registration is production-only; a failed registration never breaks the app.

---

## 9. Directions

Not yet built, ordered by leverage.

### 9.1 High-contrast outdoor mode
The dark theme is tuned for indoors. A third mode — near-black on white, no opacity-based
hierarchy, status hues at their `-700` steps, body text ≥14px — is both the accessibility story and
a genuine field-usability win. The token layer makes this roughly a 40-line addition.

### 9.2 "Leave now" countdown
Given a pinned stop, the genuinely useful number is *when to stand up*, not when the bus arrives.
`MyStopBanner` already escalates within two stops; turning that into a real countdown backed by a
notification is the highest-value unbuilt feature.

### 9.3 Route polyline on the map
Only a point is drawn today. A polyline through stop coordinates — travelled portion in signal,
remainder in line — would make the map self-explanatory.

### 9.4 Delay sparkline
`delayTrend` samples delay every poll and discards history. Retaining ~20 samples gives a
40×12px sparkline in the delay tile: "how has this trip been behaving?" in one glyph.

### 9.5 Operator theming
`SupportedServices` anticipates more operators. Each will want a mark and colour, and the palette
must absorb an operator hue without colliding with signal/delay/go/blue. Design this *before* the
second operator ships.

---

## 10. Ideas put forward

- **Arrival notification** via the Notifications API when the bus is N stops from the pinned stop —
  the most requested feature this class of app receives.
- **Pull-to-refresh** on the tracking screen; the refresh button is a desktop affordance.
- **Swipe-to-delete** on trip cards, replacing the hover-revealed trash icon (which is invisible on
  touch — see §11).
- **Trip-complete summary card** — the arrival screen already computes stops, duration, and final
  delay; making it shareable as an image extends the one emotional moment in the app.
- **Dynamic OG image per trip**, so `/track/AB1234` shares as a card showing that route's live state.
- **Long-press a stop → "meet me here"**, turning the app into a coordination tool.
- **Per-trip accent colour** from a curated set, so three saved trips are distinguishable at a
  glance — with signal reserved for whichever is active.

---

## 11. Open questions

1. The trip-card remove button is `opacity-0 group-hover:opacity-100`. On touch there is no hover —
   it is reachable by focus but effectively invisible. Swipe-to-delete or an always-visible control
   is needed; which?
2. Should light mode remain a co-equal theme, or become purely the outdoor/accessibility mode?
3. Does per-trip accent colour (§10) undermine signal's meaning as "live and current"?
4. What is the maximum acceptable data staleness before the app should stop presenting a value as
   fact — 60s? 3 minutes? A trust decision, not a technical one.
5. Speed was dropped from the hero card in favour of minutes-to-next-stop, and now appears only on
   the map badge. Is that the right trade?
