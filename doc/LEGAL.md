# Legal position and risk register

> **This is not legal advice.** It is an engineering-side analysis written to make the risks
> visible and to record the design decisions taken to reduce them. Before relying on any of it,
> get an opinion from an Indian advocate practising in technology law. The stakes are asymmetric:
> the app is free, so there is no upside that justifies guessing.

Last reviewed: August 2026.

---

## 1. What the app actually is

This matters more than anything else in this document, because most of the legal analysis turns on
it.

FindMyBus is **an alternative front-end for a tracking service the user already has access to.** It
is not a bus tracking system. It holds no vehicle data, no route database, and no relationship with
any bus operator.

The chain of events is:

1. A bus operator, using Bitla Software's Trackingo product, gives a passenger a tracking link or
   code (e.g. `AB1234`).
2. The passenger is *entitled to see that trip* — that is the entire purpose of being given the code.
3. The passenger pastes that code into FindMyBus.
4. FindMyBus requests **that one trip**, for **that one user**, from the same unauthenticated
   endpoint the operator's own web page calls, and renders it more legibly.

Nothing is stored server-side. Nothing is aggregated. Nothing is redistributed. No trip is ever
requested that a user has not personally supplied a code for.

The closest accurate analogy is a **user agent** — a browser, a reader-mode extension, an
accessibility tool. It acts for a user who already has permission, on data that user was already
shown, and it stops when the user stops asking.

**The framing that is both true and legally safest is "a better client for Trackingo", not "a bus
tracking app".** All public-facing copy should reflect that.

---

## 2. Established facts

Verified August 2026. Re-check before relying on any of these; a robots.txt or a terms page can
change overnight, and item 4 in particular would change the analysis materially.

| # | Fact | Why it matters |
| --- | --- | --- |
| 1 | The endpoint requires **no authentication, no API key, no token** | Nothing is circumvented. There is no access control to defeat. |
| 2 | `bus.trackingo.in/robots.txt` exists but contains **only a comment — zero `Disallow` directives** | No machine-readable prohibition on automated access, on the host actually being called. |
| 3 | The operator is **Bitla Software Pvt. Ltd.**, Koramangala, Bangalore. `trackingo.in` redirects to `bitlasoft.com/products/trackingo`. Contact `social@bitlasoft.com`, +91 080 44789697 | A real company with legal capacity. Not a hobby project that will ignore this. |
| 4 | Bitla's Terms & Conditions prohibit *"data mining, data harvesting, data extracting, or any other similar activity"* — but scoped to **`www.bitlasoft.com`**, their corporate site | The prohibition does not by its own terms cover `bus.trackingo.in`. But it is clear evidence of intent, and a court may weigh that. |
| 5 | There are **no API terms and no acceptable-use policy** published on the tracking service itself | Weakens any contract-based claim against users of that service. |
| 6 | FindMyBus users never visit `www.bitlasoft.com` | Browsewrap terms are hard to enforce against someone who never saw them. |
| 7 | Polling is 30s (live) / 60s (eco), per active user, one trip at a time | Load is comparable to a passenger leaving the operator's own page open. |

---

## 3. Section 43, IT Act 2000 — the central question

Section 43 imposes **civil liability (compensation)** on a person who, *without the permission of
the owner or other person in charge* of a computer resource, accesses it, downloads or extracts
data, or causes disruption or denial of access.

The whole case turns on **"without permission"**.

### Arguments that permission exists

- The server is configured to answer **anonymous requests with no credentials**. Nothing is bypassed.
- `robots.txt` on the host in question expresses **no restriction**.
- The **user holds a tracking code issued to them** for the express purpose of viewing that trip.
  The app requests only what its user is already entitled to see.
- No bulk extraction, no crawling, no storage, no redistribution.
- Request volume is per-user and modest.

### Arguments that it does not

- **"Publicly reachable" is not the same as "permitted."** Indian law has not adopted anything like
  the US position in *hiQ v. LinkedIn*. Section 43 is drafted broadly and is civil-first, so a
  claimant does not need to prove criminal intent.
- **The Government's stated position is adverse.** The Minister of State for Electronics and IT told
  the Rajya Sabha that web scraping is penalised under Section 43. That was said about AI training
  data, and a ministerial statement is not binding law, but it signals how MeitY reads the section.
- Bitla's own terms show they do not want data extracted, even if scoped to a different domain.
- Endpoints were discovered by **inspecting browser network traffic**. That is ordinary developer
  practice and not itself unlawful, but a claimant will present it as deliberately going around an
  intended interface.

### Honest assessment

**Unsettled, and genuinely arguable both ways.** The unauthenticated endpoint, the empty robots.txt,
and the user-supplied-code model are strong facts. They do not amount to a guarantee. Anyone telling
you this is definitively fine — or definitively unlawful — is overstating what Indian law currently
settles.

---

## 4. Section 66 — criminal liability

Section 66 makes a Section 43 act **criminal** only where it is done **"dishonestly or
fraudulently"**, as those terms are defined by reference to the penal code:

- **Dishonestly** — intending wrongful gain to one person or wrongful loss to another
- **Fraudulently** — intending to defraud

Penalty: up to **3 years' imprisonment, ₹5 lakh fine, or both**.

Applied here:

| Element | Position |
| --- | --- |
| Wrongful gain | None. Free, no ads, no subscription, no data sale, MIT-licensed. |
| Wrongful loss | None obvious. No revenue is diverted; Trackingo is not ad-funded per view, and the app cannot function without their service running. |
| Intent to defraud | None. The app names Trackingo as the source and does not present itself as official. |
| Circumvention | None. No credentials, no auth bypass, no rate-limit evasion. |

**Section 66 exposure looks low**, and materially lower than Section 43. The mitigations that keep
it low are the ones worth protecting: stay free, stay non-deceptive, stay attributed, never
circumvent an access control if one is added.

> Note: **Section 66A was struck down** by the Supreme Court in *Shreya Singhal* (2015) and is
> omitted. It is not relevant and should not be cited.

---

## 5. Other provisions considered

| Provision | Applies? | Reasoning |
| --- | --- | --- |
| **s.43(f), (g)** — denial of access, facilitating contravention | **Watch** | The realistic Section 43 exposure. If the app scaled and aggregate polling degraded Bitla's service, disruption becomes arguable. Keep intervals conservative. |
| **s.65** — tampering with source code | No | Nothing of theirs is altered, concealed or destroyed. |
| **s.66B** — dishonestly receiving a stolen computer resource | Weak | Data served publicly on request is poorly described as "stolen", and the dishonesty element fails as in §4. |
| **s.66C** — identity theft | No | No password, no digital signature, no unique identification feature of *any person* is used. Tracking codes identify a vehicle trip, not a human. |
| **s.66D** — cheating by personation | **Watch** | Turns entirely on branding. The moment the app looks official or implies endorsement, this becomes live. A non-affiliation disclaimer is the mitigation. |
| **s.72 / 72A** — breach of confidentiality | No | No personal data is obtained under a contract or a statutory power. |
| **s.79** — intermediary safe harbour | No | FindMyBus is not an intermediary; it does not host third-party content. Safe harbour is unavailable, so it cannot be relied on as a defence. |
| **Copyright Act 1957** | Low | Live vehicle coordinates are facts, and facts are not copyrightable. *Eastern Book Company v. D.B. Modak* requires a minimum of creativity, so "sweat of the brow" over a compilation is not enough on its own. Risk would rise sharply if the app cached and republished route/schedule compilations in bulk — it does not. |
| **Trade Marks Act 1999, s.29(4)** / passing off | **Watch** | Using "Trackingo" to say what the app is compatible with is nominative/descriptive use and normally acceptable. It must never appear in the product name, the domain, the logo, or in any way suggesting endorsement. |
| **Contract / browsewrap** | Low | Bitla's terms bind users of `www.bitlasoft.com`. FindMyBus users never go there. Enforceability of unread browsewrap against a non-visitor is weak. |
| **DPDP Act 2023** | **Action needed** | See §6. |

---

## 6. DPDP Act 2023 — and a correction to our own claims

`/api/*` is proxied through Netlify to `bus.trackingo.in` so the browser does not hit a CORS wall.
**That proxy is our infrastructure, and it necessarily sees every request** — source IP, user agent,
and the path containing the tracking code. Netlify retains access logs.

That makes some of the project's own copy inaccurate:

| Claim | Status |
| --- | --- |
| "Zero data collection — does not store, transmit, or log any user data" (`llms.txt`) | **Wrong.** The proxy transmits, and Netlify logs. |
| "All data stays in your browser" (in-app footer) | **Misleading.** Saved trips do. API requests do not. |
| "All trip history is saved only in your browser's localStorage and never leaves your device" | **Correct.** Trips genuinely never leave the device. |

An IP address tied to a request is capable of being personal data. Overstating a privacy posture is
its own risk — separately from the DPDP Act, a materially false privacy claim is a consumer-protection
and misrepresentation problem, and it is the kind of thing that turns a polite complaint into a
formal one.

**Fixed by describing the proxy honestly rather than by claiming it does not exist.** See §7.

---

## 7. Mitigations in place

| # | Mitigation | Where |
| --- | --- | --- |
| 1 | Non-affiliation disclaimer, stated prominently | `README.md`, `llms.txt`, `AppFooter`, `DataSourceNote` |
| 2 | Bitla/Trackingo credited as the data source and owner | `README.md`, in-app on every screen |
| 2a | **In-product disclosure that the app is a presentation layer, not a tracker.** Users do not read READMEs, so the statement lives in the UI: a `DataSourceNote` card on first run and on the desktop pane, a compact line in the add sheet and trip list, and an attribution line in the footer of every screen | `SupportedServices.tsx`, `AppFooter.tsx` |
| 3 | Honest description of the proxy — no "zero logging" claim | `README.md`, `llms.txt`, in-app |
| 4 | Conservative polling, 30s / 60s, documented as a courtesy floor contributors must not lower | `README.md`, `CONTRIBUTING.md` |
| 5 | One trip per user, per user-supplied code. No crawling, no enumeration, no bulk fetch | Architecture |
| 6 | Nothing stored or redistributed server-side | Architecture |
| 7 | No monetisation of any kind | Product |
| 8 | Named contact and an explicit undertaking to act on any request from Bitla | `README.md`, `SECURITY.md` |
| 9 | Trackingo's name used descriptively only; never in the product name, domain, or logo | Brand |
| 10 | No authentication is ever circumvented; if auth appears, the integration stops | Policy, below |

---

## 8. Standing policy

These are commitments, not aspirations. Breaking one changes the legal analysis above.

1. **If Bitla asks us to stop, we stop — immediately and without argument.** No negotiation, no
   delay, no "let me first migrate users". This is the single most important line in this document.
2. **If an API key, token, session check, or any access control is introduced, the integration ends.**
   We do not work around it, reuse a key scraped from their client, or spoof headers to look like
   their app. That crosses from "arguably permitted" to plainly unauthorised.
3. **Polling intervals are never reduced below 30s.**
4. **No bulk fetching, code enumeration, guessing, or crawling.** Only codes a user supplies.
5. **No server-side storage or redistribution** of their data.
6. **No monetisation** — not ads, not subscriptions, not data sales. Revenue is the fact that turns
   a Section 43 argument into a Section 66 one.
7. **No implication of partnership or endorsement**, ever.

---

## 9. Open actions

Ordered by value.

1. **Write to Bitla Software (`social@bitlasoft.com`).** By a wide margin the highest-value action
   available. Express permission removes the "without permission" element of Section 43 **entirely**,
   and no amount of careful drafting achieves the same. Realistic outcomes: they say yes; they say
   yes with conditions; they say no and you shut it down cheaply and early; or they ignore it, and
   you have documented good faith. Every one of those is better than the current position. A
   suggested draft is in §10.
2. **Get an Indian advocate to review this document** before any promotion of the app.
3. **Publish your own Terms of Use and Privacy Policy**, accurately describing the proxy and the
   absence of any warranty. MIT covers the *code*; it says nothing about operating a *service*.
4. **Re-check `bus.trackingo.in/robots.txt` and Bitla's terms periodically.** Fact 2 and Fact 4 are
   load-bearing and can change without notice.
5. **Decide the shutdown trigger in advance** — who can take the site down, and how fast. Deciding
   this calmly now is much better than deciding it during a legal notice.

---

## 10. Suggested outreach to Bitla

Send from a real name, plainly, with no legal posturing. You are asking permission for something
that makes their product look good.

> **Subject:** FindMyBus — a free open-source UI for Trackingo, asking your permission
>
> Hello,
>
> I'm an independent developer in Kerala. I built a small free app called FindMyBus that shows a
> Trackingo tracking code on a cleaner, mobile-friendly screen — a map, a stop timeline, and delay
> information. It's open source under MIT, has no ads, no accounts and no revenue, and I get nothing
> from it.
>
> It only works for a user who already has a tracking code from their operator, and it requests just
> that one trip, at most once every 30 seconds. It stores nothing on any server of mine and
> redistributes nothing. Trackingo is credited as the data source and I make it clear the app is
> not affiliated with or endorsed by Bitla Software.
>
> I'm writing to ask whether you're comfortable with this, and whether you'd like anything changed —
> attribution, request rate, wording, anything. **If you'd prefer I take it down, I will do so
> straight away.** I'd also be glad to hand the work over to your team if it's useful to you.
>
> Source: https://github.com/abhijith-p-subash/FindMyBus
> Live: https://findmybus.abhijithpsubash.com
>
> Thank you for your time,
> Abhijith P Subash

---

## Sources

- [Section 43, IT Act 2000 — Indian Kanoon](https://indiankanoon.org/doc/39800/)
- [The Information Technology Act, 2000 — India Code (full text)](https://www.indiacode.nic.in/handle/123456789/13116)
- [MeitY position on scraping under Section 43 — MediaNama](https://www.medianama.com/2025/02/223-experts-concerned-about-meitys-stance-on-web-scraping-to-train-ai-models/)
- [Legality of data scraping under Indian law — Spice Route Legal](https://spiceroutelegal.com/publications/legality-of-data-scraping-under-indian-law/)
- [Data scraping and legal issues in India — S.S. Rana & Co.](https://ssrana.in/articles/data-scraping-issues-india/)
- [DPDP Act 2023 compliance overview — EY India](https://www.ey.com/en_in/insights/cybersecurity/decoding-the-digital-personal-data-protection-act-2023)
- [Bitla Software — Trackingo product page](https://www.bitlasoft.com/products/trackingo)
