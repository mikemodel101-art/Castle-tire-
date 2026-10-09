# Castle Tire Shop — Project Blueprint

> Cloud-based shop operations for a Massachusetts tire & repair shop.
> **Status:** working demo (100% dummy data, no database). Production backend planned.
> **Owner:** Castle Tire Shop · **Stack:** Next.js 16 + React 19 + Tailwind 4 · **No vendor lock-in.**

---

## 1. Why this exists

Castle runs on a paper inspection sheet, phone calls, and memory. That loses money:

- Inspections live on paper → customers never see the proof → slow approvals.
- Photos stay on techs' phones → no vehicle history.
- Estimates are verbal → no follow-up → cold leads.
- New hires take weeks to learn “how we do things.”

**This app turns one car visit into a 6-step digital flow:**

```
Check-in → Accept → Inspect → Photo → Text report → Estimate & approve
   (1)       (2)       (3)       (4)       (5)            (6)
```

Every step is usable on Windows PC, iPhone, Android, and tablet. Customers need only a browser — no app, no login.

---

## 2. Who uses it

| Persona | Device | Core loop |
|---|---|---|
| **Tech (Luis, Kevin)** | Phone in the bay | Accept job → inspect → photos → complete |
| **Advisor (Jen)** | Front-desk PC/tablet | Check in → send report → follow up estimates |
| **Owner (Mike)** | Anywhere | Dashboard money → approve edge cases → review history |
| **Customer** | Their own phone | Open `/r/CODE` link → view photos → tap Approve |

Demo logins (autofill on `/login`): `admin@castletire.com / Castle2026` (Mike), `tech@castletire.com / Tech2026` (Luis).

---

## 3. Newcomer journey (the “I get it in 10 minutes” path)

Designed so a first-day hire succeeds without training:

1. **Welcome modal** on first visit → explains the 6 steps + offers the tour.
2. **60-second guided tour** (`Compass` button / sidebar) — 5 cards that deep-link to Dashboard → Jobs → Inspections → Reports → Estimates.
3. **Getting-started checklist** on the dashboard — 6 items, auto-checked as the user actually does them (stored in `localStorage: castle-onboard-v1`).
4. **`/guide` page** — expandable 6-step journey with “Try it” tasks on dummy data, role tracks (Tech / Advisor / Owner), phone tips, and FAQ.
5. **Contextual `?` HelpTips** on every major page header + coach marks inside the inspection wizard.
6. **Safe sandbox** — banner + guide constantly remind: dummy data, reset anytime in Settings.

Success metric: a newcomer completes check-in → inspection → report → estimate on dummy data in < 15 min.

---

## 4. Information architecture & routes

```
 /login                     Animated login + demo autofill (public)
 /dashboard                 Morning briefing: money, alerts, schedule, activity, leaderboard
 /jobs                      Today's Jobs: Waiting / In Progress / Completed (cards + timeline)
 /jobs/new                  Check-in: customer + vehicle + complaint (+?vehicle= prefill)
 /jobs/[id]                 Job detail: accept → status timeline → inspection/estimate/media
 /inspections               Queue: search, tech filter, red-only, CSV export
 /inspections/[jobId]       Wizard: tires → brakes → suspension → alignment → TPMS → repairs
 /inspections/[jobId]/complete   Summary + Send to Customer + Create Estimate
 /inspections/[jobId]/sheet      Printable filled-out paper sheet
 /media                     Library: upload (camera on phones), filter by category/job
 /customers                 Search (name/phone/plate) + segments + lifetime value
 /customers/[id]            360° view: vehicles, visits, open recs, texts, media
 /vehicles                  Fleet: health dots, due badges, make filter, sort
 /estimates                 Pipeline funnel + aging + ready-to-estimate shortcuts
 /estimates/[id]            Builder: templates, discount/deposit, per-line approve, text
 /expenses                  Money tracker: income vs expenses, net, cash-flow bars, categories, CSV
 /messages                  Threads: every text logged, quick replies, SMS deep-links
 /reports                   Report inbox: ready/sent, preview, copy link, funnel
 /guide                     Newcomer guide (see §3)
 /settings                  Shop profile, text templates, thresholds, team, export, reset
 /r/[code]                  PUBLIC customer report (no login)
 /r/[code]/sheet            PUBLIC printable inspection sheet
 /api/health                { ok, mode: "demo", database: "none" }
```

Auth: demo cookie (`castle_session`) set by a server action; `(app)` layout redirects to `/login` when missing.

---

## 5. Data model (dummy data)

No database. `src/lib/seed.ts` builds a `ShopState` anchored to “today”; `src/lib/store.tsx` persists it to `localStorage` (`castle-tire-demo-v4`, debounced). `src/lib/demo-storage.ts` validates saved JSON at initial load and on cross-tab updates. Valid v3 records migrate to v4; missing/invalid collections recover independently. Damaged raw saves are backed up before repair when storage is available. Restricted browsers run the same demo entirely in memory.

```
ShopState
├── settings: shop profile, tread/pad thresholds, tax, ALG packages, SMS templates
├── team: Member[id, name, role, initials]
├── customers: Customer[id, name, phone, email, city, since]
├── vehicles: Vehicle[id, customerId, year/make/model/trim/color, plate, mileage, vin, photo?]
├── jobs: Job[id, date, time, customerId, vehicleId, complaint, status, assignedTo, mileageIn, timeline[]]
│     status: waiting → accepted → inspection → inspection_complete → customer_contacted → approved → completed
├── inspections: Inspection[jobId, techId, startedAt, completedAt,
│     tireSize/Brand, tires{LF,RF,LR,RR: tread, grade}, brakes{front,rear: pad, rotor},
│     tpms{status, tpmNumber, psi{}}, suspension{status, parts[], other}, alignment{status, package},
│     notes{}, additionalNotes, recommended{}]
├── media: Media[id, jobId, vehicleId, section, item?, photo|video, url, caption, takenAt, by]
├── reports: Report[code, jobId, createdAt, sentAt?]
├── estimates: Estimate[id, jobId, createdAt, status, sentAt?, approvedAt?, lines[]]
│     lines: [section, description, priority, parts, labor, decision]
├── messages: Message[id, customerId, jobId?, out|in, body, at, kind, link?, by?]
└── expenses: ExpenseTransaction[id, date, at, income|expense, category, description, amount, method, jobId?, by]
```

Key invariants:
- One inspection + one report + one estimate per job max (store enforces “find or create”).
- Job status only moves forward (`advance()` guards regressions).
- Seeded report codes (e.g. `K7Q2XM`) are stable; new codes are random 6-char.
- Photos compress to JPEG data-URLs (persist); videos stay as `blob:` (session-only, filtered on reload).

---

## 6. Inspection rules (the paper sheet, encoded)

Thresholds live in Settings (`treadSoon=5, treadReplace=3, padSoon=5, padReplace=3`):

- **Tires:** tread in /32nds → `≤replace` = Replace (red), `≤soon` = Soon (yellow), else Good (green). Tech can override per corner.
- **Brakes:** pad mm uses the same bands; rotor is Good/Worn/Replace; axle light = worst of the two.
- **TPMS / Suspension / Alignment:** OK (green) / Rec (yellow) + details (TPM #, parts, ALG 79/89/99/120).
- **Repairs grid:** OK / Soon / Future / Now per section; auto-suggested from measurements, tech-adjustable.
- **Summary chips:** Tires/Brakes show *Good/Soon/Replace*; others show *Good/Soon/Future/Recommended*.
- **Overall:** worst light across the 5 sections.

Price book (`buildEstimateLines`): 4-tire logic (3→4), pads vs pads+rotors per axle, ALG package price, TPMS sensor vs relearn, per-part suspension prices. Tax = `parts × taxRate`.

---

## 7. Feature map (what's new in this round)

| Area | Added |
|---|---|
| **Dashboard** | Revenue cards (approved/awaiting/avg), 30-day expense snapshot, 7-day trend bars, shop-load donut, live activity feed, prioritized alerts (red-not-contacted, stale estimates), tech leaderboard, quick actions, first-run banner + checklist; workflow strip = responsive grid on desktop + swipe carousel with arrows/dots on phones |
| **Expenses** | Income-in vs expenses-out with net + margin, 14-day dual cash-flow bars, category donuts, range/type/category/search filters, add/edit/delete modal with job linking, CSV export |
| **Jobs tabs** | Responsive segmented tabs (short labels on phones, hints on desktop, live counts, helper footer) + wrap-safe cards (truncated time/tech, smaller thumbs on phones) |
| **Today's Jobs** | Timeline view, tech filter, urgent-only (red findings), sort (time/status/tech), wait-time labels, per-card inspection %, media count, estimate badge, unassigned callouts |
| **Inspections** | Queue stats (avg time, red/yellow, completion %), search, tech + red-only filters, CSV export; wizard gains previous-visit tread comparison, note templates, validation warnings, live “customer will see” preview, newcomer coach marks |
| **Estimates** | Pipeline funnel, stale/follow-up flags, search + sort; detail gains line templates, duplicate line, category picker, discount %, deposit → balance, validity, urgency subtotals, decision progress, shop-only notes |
| **Vehicles** | Due-for-service engine (6 mo / 6k mi / findings), make filter, due-only, sort (recent/mileage/visits), stat cards, red rings |
| **Customers** | Segments (VIP/New/Returning/At-risk) with counts, lifetime + awaiting value, open-rec counts, sort, win-back hints; detail gains 4-stat header |
| **Reports** | Sent-rate + avg-time-to-send, report→approval funnel, oldest-unsent nudge, search + tech filter, READY pulse, media counts |
| **Onboarding** | Welcome modal, 60-sec tour, auto-checklist, `/guide`, HelpTips everywhere, demo safety copy |

---

## 8. Tech architecture

```
Next.js 16 App Router (Turbopack) · React 19 · TS strict · Tailwind 4 · lucide-react
├── Server: layout auth gate, login/logout actions, /api/health, PWA manifest
├── Client: external-store (useSyncExternalStore) + localStorage, zero backend calls
├── Styling: Tailwind utilities + brand theme (Castle red) + keyframe anims in globals.css
├── Media: Pexels stock (photos + videos) via hotlink; uploads via <input capture>
└── PWA: manifest.ts + icon.svg; install prompts documented in Settings & Guide
```

File map:

```
src/app/(app)/*        → one folder per module above (+ guide)
src/app/r/[code]       → public customer report (separate, unauthenticated tree)
src/components/
  brand.tsx            → Castle logo, tire/car/brake SVGs
  ui.tsx               → Card, PageHeader, chips, badges, toggles, skeletons
  analytics.tsx        → StatCard, MiniBars, Donut, Funnel
  onboarding.tsx       → welcome modal, tour, checklist, HelpTip, banner
  inspection-extras.tsx→ previous-compare, templates, warnings, preview
  photo-capture.tsx    → camera modal (compress + save)
  send-report-modal.tsx→ SMS composer + phone preview
  customer-report.tsx  → public report renderer
  inspection-sheet.tsx → printable paper-sheet replica
  app-shell.tsx        → sidebar/drawer/tabs + onboarding wiring
  toast.tsx            → tiny toast system
src/lib/
  data.ts              → types + constants + stock media
  seed.ts              → dummy dataset builder (STORE_VERSION=4)
  demo-storage.ts      → runtime JSON validation, recovery, v3 migration
  store.tsx            → safe external store + actions + session-only fallback
  utils.ts             → dates, formatting, inspection math, estimates, lookups
  insights.ts          → analytics: LTV, due engine, funnels, trends, feed, alerts
  auth.ts              → demo accounts + session cookie
```

---

## 9. Dummy-data & deployment contract

- **Vercel-safe:** no `DATABASE_URL`, no server DB import anywhere (`grep drizzle|@/db` outside `src/db/schema.ts` placeholder = empty). Build works with zero env vars.
- **`next.config.ts`** contains a legacy-file safety net that deletes first-version leftovers (`r/[reportId]`, old components) at build time if they still contain old code — prevents the “Ambiguous app routes” failure when repos are updated by upload-on-top.
- **`.gitignore`** excludes `node_modules/.next/.env/.vercel`; **`README.md`** covers deploy + PWA + FAQ.
- Anchor-day shifting: stored dates slide forward when the demo is opened on a later day, so “Today” always has work.

---

## 10. Validation

```bash
npx next typegen          # route types
npm exec tsc -- --noEmit  # strict TS
npm run build             # production build (Turbopack)
# then: build_and_start → /api/health { ok:true, mode:"demo", database:"none" }
```

Smoke: anonymous `/login`, `/r/K7Q2XM` → 200; authed app routes → 200; deep links (`?vehicle=`, `?step=`, `?job=&section=`, `?c=`) → 200.

---

## 11. Roadmap to production (no lock-in)

1. **Postgres + Drizzle** — move `ShopState` tables 1:1; keep the same action names as API routes.
2. **Auth** — replace demo cookie with real email/password (or Auth.js) + roles.
3. **Storage** — S3/R2 for photos/videos; keep compression client-side.
4. **SMS** — Twilio: send `reportTemplate`/`estimateTemplate` for real; inbound webhooks → `messages` (direction=in).
5. **Realtime** — polling or websockets for multi-bay updates; keep external-store shape.
6. **Observability** — Sentry + Vercel analytics; audit log per job.

Everything above is standard OSS (Next.js, Postgres, Drizzle, Tailwind) — any developer can take over; data exports (JSON/CSV) already exist in Settings.

---

## 12. Page-load recovery

The exact generic “This page couldn’t load” screen was reproduced in Chromium with
an incomplete v4 save (`jobs: null`, missing other collections). The old loader
cast arbitrary parsed JSON to `ShopState`; the shell crashed while filtering jobs.

Current safeguards:

- `src/lib/demo-storage.ts` validates collections, nested inspection measurements,
  status enums, money, timestamps and parent/child relationships.
- `src/lib/store.tsx` uses that validator for initial reads and `storage` events;
  old v3 records migrate, valid edits survive repair, and damaged saves are backed up.
- Storage access/quota errors do not crash the app: memory-only mode remains usable.
- `persistence-notice.tsx` explains recovery/migration and allows backup download.
- `src/app/error.tsx` and `global-error.tsx` use `recovery-screen.tsx` for explicit
  retry/reload and a confirmed, app-specific restore option.
- Onboarding accepts only known booleans and bounds-checks tour positions. Sidebar
  and dashboard tour controls share state and correctly restart from the beginning.

Regression assets:

- `tests/demo-storage.test.ts`: 12 Node tests for healthy/partial/corrupt/legacy saves,
  invalid dates, expired media, duplicate IDs, empty lists, and retained valid edits.
- `scripts/browser-smoke.cjs`: real-browser login and route checks, expense saving,
  tour replay, saved-data repair, blocked storage, and cross-tab update checks.
- Commands are documented in README.md. Browser-only preview-wrapper failures
  remain the hosting UI’s responsibility; use a direct preview URL to distinguish them.
