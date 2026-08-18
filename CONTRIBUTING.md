# Contributing to FindMyBus

Thanks for being here. This is a small, opinionated codebase — a couple of thousand lines — so
please read the conventions below before writing code. Most review comments on a first PR come from
these six things.

By participating you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting set up

```bash
git clone https://github.com/abhijith-p-subash/FindMyBus.git
cd FindMyBus
npm install
npm run dev
```

Node 20+. No `.env`, no API keys — the dev server proxies `/api` upstream for you.

No live tracking link? Open `/track/DEMO` for a simulated trip that advances while you watch. Most
UI work can be done entirely against it.

## Before you open a PR

```bash
npm run verify   # lint + format check + typecheck + build
```

CI runs exactly this. If `verify` is green locally it will be green on GitHub.

There is **no test suite** yet. Adding one is genuinely welcome — `src/utils.ts` is pure and
dependency-free, so it is the natural starting point. Until then, say in your PR description what
you actually exercised in the browser, and mention which viewport: the layout diverges at `lg`
(1024px) between the phone column and the desktop two-pane view.

## Six things that will trip you up

**1. Never use a raw Tailwind colour.** Every colour goes through a design token
(`bg-surface`, `text-ink-3`, `border-line`, `text-signal-text`). These resolve to CSS custom
properties redefined under `:root.light`, which is what makes light mode work without per-element
overrides. Writing `bg-zinc-900` or `text-amber-400` silently breaks light mode. If you need a
colour that does not exist, add a token in `src/index.css` — both themes.

**2. Upstream stops arrive duplicated.** `eta_map_data` repeats entries for the same stop name.
Anything that counts, indexes, or takes first/last **must** call `dedupeStops(stops, currentId)`
first, or your indices will not match what the timeline renders. Several call sites dedupe
independently; that is deliberate, not redundancy to clean up.

**3. `MapPanel`'s `isolate z-0` is load-bearing.** Leaflet assigns its panes and controls z-indexes
up to 1000. Without a stacking context there they escape the map and paint over the hero card,
timeline, and header. This was a real bug; please don't remove it.

**4. Leaflet initialises exactly once.** The map lives in a ref and its init effect has an empty
dependency array on purpose. Position, marker state, and resize are handled by separate effects.
Letting the init effect re-run orphans a map instance.

**5. Never commit a real tracking code.** Codes in examples (`AB1234`, `CD5678`) are illustrative
and resolve to nothing. A real code is a live handle on a real vehicle — committing one publishes
the ability to follow that bus, and CI will fail the build. This applies to issues and PR
descriptions too: mask any code before pasting a URL or an API response.

**6. Don't lower the polling interval.** 30s live / 60s eco is a deliberate courtesy to a server
that isn't ours. See [What this is, and what it isn't](README.md#what-this-is-and-what-it-isnt) in the README,
and [`doc/LEGAL.md`](doc/LEGAL.md).

## Style

Prettier and ESLint decide; `npm run format` fixes most things. In summary: no semicolons, single
quotes, 2-space indent, 100 columns.

Beyond formatting:

- **Named exports** for components and hooks. `App` is the only default export.
- **Components stay presentational.** Anything stateful or persisted becomes a hook in `src/hooks/`.
- **Pure logic goes in `src/utils.ts`**, shared types in `src/types.ts`. Both stay dependency-free.
- **Numeric display text** gets `font-mono` and the `.tnum` class so digits don't reflow as they tick.
- **Comment the why, not the what.** The existing comments explain non-obvious constraints; match
  that rather than narrating the code.
- Bumping the shape of `Trip` means a new storage key version (`-v3`) plus a migration, not an
  optimistic read of old data.

## Commits and branches

`main` is the deployed branch; day-to-day work lands on `development`. Branch from `development`
unless your change is a hotfix.

Commit messages: a short imperative subject line. [Conventional
Commits](https://www.conventionalcommits.org/) prefixes (`feat:`, `fix:`, `docs:`, `refactor:`) are
appreciated but not enforced.

Keep PRs focused. A formatting-only sweep mixed into a behaviour change is very hard to review.

## Adding support for another operator

The most valuable contribution available, and it's smaller than it looks:

1. Teach `parseTrackingKey` in `src/utils.ts` to recognise the new URL shapes and codes.
2. Add the operator to the `SERVICES` array in `src/components/SupportedServices.tsx` — both the
   full list and the one-line note read from it.
3. If its API differs from trackingo.in's, adapt in the fetch layer so `ApiResponse` stays the
   single shape the UI knows about. Please don't leak operator-specific shapes into components.
4. Add the proxy rule to `netlify.toml` **and** `vite.config.ts`, and extend `connect-src` in the
   CSP if the host differs.

Include a sample response (with anything identifying removed) in the PR so the parsing can be
reviewed.

## Reporting bugs

Use the [bug report template](https://github.com/abhijith-p-subash/FindMyBus/issues/new/choose). The
two details that matter most: **which viewport** and **whether it reproduces on `/track/DEMO`** — the
latter separates UI bugs from upstream data problems immediately.

## Questions

Open a [discussion or issue](https://github.com/abhijith-p-subash/FindMyBus/issues). If you're
unsure whether an idea fits, ask before building it — it saves you work.
