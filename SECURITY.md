# Security Policy

## Supported versions

FindMyBus is a single deployed web app. Only the current `main` branch and the live deployment at
`findmybus.abhijithpsubash.com` are supported. There are no maintained older releases.

## Reporting a vulnerability

**Please do not open a public issue for a security problem.**

Use GitHub's private reporting:
[**Report a vulnerability**](https://github.com/abhijith-p-subash/FindMyBus/security/advisories/new)

If that is unavailable to you, email **abhijith.p.subash@gmail.com** with `SECURITY` in the subject.

Please include:

- What the issue is and roughly how severe you think it is
- Steps to reproduce, or a proof of concept
- Affected version, browser, and platform

You can expect an acknowledgement within **72 hours** and an assessment within **7 days**. This is a
side project maintained by one person, so please be patient with fixes; you will be kept informed.

Credit will be given in the release notes unless you would rather stay anonymous.

## Scope

The app has no backend, no accounts, and no server-side storage, which rules out whole classes of
issue. Things genuinely in scope:

- XSS through crafted tracking URLs, trip names, or upstream API values rendered into the DOM
- Service worker cache poisoning, or cached data leaking between origins
- Content Security Policy bypasses (headers live in `netlify.toml`)
- Anything causing one user's `localStorage` trip data to be exposed to another origin
- Dependency vulnerabilities that are actually reachable in the shipped bundle

Out of scope:

- Issues in `bus.trackingo.in` itself. It is a third-party service; report those to its operator,
  not here.
- OpenStreetMap tile server behaviour.
- Missing security headers on a self-hosted fork that has not reproduced `netlify.toml`.
- Findings that require a compromised device, a malicious browser extension, or physical access.
- Automated scanner output with no demonstrated impact.

## What the app stores

Everything is client-side, in `localStorage`, and never transmitted anywhere:

| Key | Contents |
| --- | --- |
| `bus-tracker-trips-v2` | Saved trips: tracking code, name, last known position |
| `bus-tracker-theme` | Theme preference |
| `bus-tracker-data-saver` | Eco-mode preference |
| `bus-tracker-mystop-<KEY>` | Pinned destination stop per trip |
| `bus-tracker-install-dismissed` | Whether the install prompt was dismissed |

No cookies, no analytics, no third-party scripts. Clearing site data removes everything.

Note that tracking codes are not secrets: anyone holding a code can watch that bus, which is how
share links work by design.
