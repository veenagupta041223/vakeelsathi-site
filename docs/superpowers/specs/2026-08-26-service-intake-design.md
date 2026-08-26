# Service-based intake form — design spec

Date: 2026-08-26
Status: Approved, pending implementation

## Context

VakeelSathi's `index.html` is currently a pre-launch "Coming Soon" page with a
countdown timer and an Instagram follow CTA — no lead-capture form exists
today. A waitlist form existed previously but was deliberately removed twice
(`671a055`, `a3a113a`) "pending DPDP compliance review." DPDP-compliant
`privacy.html` and `terms.html` were added afterward with the explicit intent
to "add back with proper compliance once ready" (`3b7eae9`).

The ask: restructure the page around a services catalog (inspired by
onlinelegalindia.com's service-grid pattern) so a visitor picks the legal
service they need and submits an intake request, instead of a single generic
waitlist form. The site remains pre-launch — this is lead capture ("we'll
match you with a lawyer when we launch"), not live case intake.

Checked the Cloudflare account that also runs the mobile app's video-call
TURN server: no Workers, D1 databases, KV namespaces, or Pages projects exist
there, and `vakeelsathi.in` is not a DNS zone in that account. There is
nothing to "reuse" from the mobile app beyond the account itself — this
requires new infrastructure.

## Goals

- Visitor can pick one of 4 legal service categories and submit name, phone,
  and (optional) issue details as a pre-launch lead.
- Submissions are stored in a real, queryable database the team owns (not a
  third-party form service).
- DPDP-compliant: explicit consent captured per submission, spam-resistant,
  policy documents accurately describe what's collected.
- No changes to how the site is hosted (stays on GitHub Pages) or to DNS.

## Non-goals

- No admin UI for viewing/managing leads (query via `wrangler d1 execute` or
  the D1 dashboard tab).
- No rate limiting beyond CORS + honeypot (add later if actually abused).
- No migration of hosting to Cloudflare Pages, no custom `api.vakeelsathi.in`
  subdomain (would require moving DNS nameservers — out of scope, bigger
  blast radius than this feature needs).
- No changes to `styles.css` / `thank-you.html`'s legacy design system
  inconsistency — pre-existing, unrelated to this work.

## Page layout changes (`index.html`)

Current flow: Nav → Hero → About → Countdown timer → Instagram offer →
Footer.

New flow: Nav (unchanged, "Coming Soon" badge stays) → Hero (unchanged) →
About (unchanged) → **new: services catalog + intake form** (replaces the
countdown section and its JS timer entirely) → Instagram offer (unchanged) →
Footer (unchanged).

### Services catalog

4 cards, matching the categories already implied by the existing About copy:
Property Disputes, Family Matters, Consumer Complaints, Contracts &
Agreements. Each card: icon (inline SVG, same style as other icons in the
file), title, one-line description. Clicking a card smooth-scrolls to the
form below and pre-selects that service in the dropdown.

### Intake form

Fields: Full name (required), Phone (required, `/^\d{10}$/`, same rule the
old form used), Service (dropdown, required, pre-filled by card click, values
match the D1 `service` enum below), brief issue description (optional
textarea), consent checkbox (required, not pre-checked — see DPDP section),
honeypot field (hidden, must stay empty).

Styling stays inline in `index.html`'s existing `<style>` block using the
live `--primary`/`--secondary`/`--accent` variables — that block is the
site's actual live design system; `styles.css` is legacy and only
`thank-you.html` still references it (out of scope to touch).

## Backend: Worker + D1

### Data flow

Form submit is intercepted by JS (`preventDefault`) → client-side validation
→ `fetch()` POSTs JSON to the Worker → Worker validates server-side and
inserts a row into D1 → responds `200 {ok:true}` → JS redirects the browser
to `thank-you.html`. On a `400` validation response, or a network failure,
the JS shows an inline error near the submit button without losing what the
visitor typed or leaving the page.

### D1 schema

Database: `vakeelsathi_leads`. Single table:

```sql
CREATE TABLE leads (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  service     TEXT NOT NULL CHECK (service IN (
                'property-disputes', 'family-matters',
                'consumer-complaints', 'contracts-agreements', 'other')),
  message     TEXT,
  consent     INTEGER NOT NULL CHECK (consent = 1),
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  user_agent  TEXT
);
```

`created_at` doubles as the consent timestamp — no separate consent-log table
at this volume.

### Worker API

Single route: `POST /submit`. Anything else → `404`.

- **CORS**: `Access-Control-Allow-Origin` restricted to `https://vakeelsathi.in`
  (handle the `OPTIONS` preflight accordingly; other origins get no CORS
  headers, so the browser blocks the response).
- **Validation** (mirrors the client, enforced server-side regardless): name
  non-empty ≤ 100 chars; phone matches `/^\d{10}$/`; service is one of the 5
  enum values; `consent === true`.
- **Honeypot**: if the hidden `hp` field is non-empty, respond `200 {ok:true}`
  without inserting a row — don't tip off bots that they were caught.
- **No auth, no rate limiting** for v1 — it's a public lead form; CORS +
  honeypot + Cloudflare's free-tier volume is enough at this stage.
- Responses: `200 {ok:true}` on success; `400 {ok:false, error:"..."}` on
  validation failure, with a message the frontend can display directly.

### Deployment

New `worker/` directory in this repo: `wrangler.toml` + `src/index.ts`, D1
binding. Worker script name: `vakeelsathi-leads` (so its URL is
`https://vakeelsathi-leads.<account-subdomain>.workers.dev/submit` — the
frontend hardcodes this full URL as its fetch target). Database created via
`wrangler d1 create vakeelsathi_leads`, its id recorded in `wrangler.toml`.
Deployed manually via `wrangler deploy` to the default `*.workers.dev`
subdomain (matches the static site's current no-CI/no-build simplicity) — no
secrets required.

## DPDP compliance

- Consent checkbox is required (both client- and server-enforced via the
  `consent = 1` CHECK constraint) and is **not** pre-checked. Label links
  directly to `privacy.html` and `terms.html`.
- `privacy.html` Section 2 ("What Personal Data We Collect") gets one new
  bullet naming the category this form adds: which legal service was
  selected and any free-text details volunteered about the issue.
- `privacy.html` Section 6 ("Data Sharing and Third Parties") gets Cloudflare
  named as an example of the "Service Providers: Hosting providers" bullet,
  since it's now an actual data processor (Worker + D1), not just a
  hypothetical.
- These are small, additive text edits — no restructuring of the existing
  policy. They are **not a substitute for legal review**: given DPDP
  compliance is why the previous form was pulled twice, and the free-text
  "issue description" field could contain sensitive details about someone's
  legal matter, a human legal/compliance reviewer should sign off on the
  updated policy wording before this ships live.

## Error handling

- Network failure (`fetch` throws) or Worker/D1 outage: generic inline
  message ("Something went wrong — please try again, or reach us at
  support@vakeelsathi.in") — form data is preserved, not cleared.
- Validation failure (`400`): show the Worker's returned message inline next
  to the relevant field.

## Testing plan

- `wrangler dev` locally against local D1: exercise `/submit` via curl and
  via the page served locally.
- Deploy to `workers.dev`; submit a valid entry from the live page, confirm
  the row via `wrangler d1 execute --remote`, confirm redirect to
  `thank-you.html`.
- Confirm rejections: bad phone, missing consent, honeypot filled (expect
  `200` but no row inserted).
- Confirm CORS: a request with a different `Origin` header is blocked.
- Manual responsive check: cards collapse to 1 column on mobile, form is
  usable on a small screen.
