# Castle Tire Shop — Shop Operations

Daily shop work in one PWA: **work orders → Today's Jobs → digital inspections → photos & video → texted customer reports → estimates & approval → history.** Built for the bay (phones) and the front desk (PC/tablet). Customers just open a link — no app, no login.

> **Demo:** 100% dummy data, no database, no env vars. Click anything — reset anytime in **Settings → Reset demo data**.

---

## Demo logins (autofill on the login page)

| Role | Email | Password | You are |
|---|---|---|---|
| Manager | `admin@castletire.com` | `Castle2026` | Mike Sullivan |
| Technician | `tech@castletire.com` | `Tech2026` | Luis Ortega |

---

## Your first 10 minutes (newcomer path)

1. **Take the tour** — the welcome popup (or `Compass` button) walks Dashboard → Jobs → Inspections → Reports → Estimates in 60 seconds.
2. **Open the [Newcomer Guide](/guide)** — 6 expandable steps with “Try it” tasks on dummy data + FAQ. Also in the sidebar.
3. **Follow the checklist** on the dashboard — it auto-checks as you really do each step:
   `Create job → Accept → Inspect → Photo → Send report → Estimate`.
4. **Try the golden path** with seeded data:
   - `Jobs → New Vehicle` — type `857 555` and watch John Smith autofill.
   - Open a **Waiting** card → green **Accept Job**.
   - `Inspections` → type `4` in LF tread (turns yellow), `2` (turns red), tap the camera.
   - **Complete Inspection → Send to Customer** → preview the phone view.
   - **Create Estimate** → text it → open `/r/K7Q2XM` in a private window to see the customer side.

Look for **`?` tips** on every page and **coach marks** inside the inspection wizard.

---

## What each module does

- **Dashboard** — money today (approved / awaiting / avg ticket), shop-load donut, 7-day trend, prioritized alerts (red-not-contacted, stale estimates, unassigned), live activity feed, tech leaderboard, quick actions.
- **Today's Jobs** — Waiting / In Progress / Completed with counts; card + timeline views; search; tech filter; urgent-only (red findings); sort; wait-time + inspection % + media + estimate badges per card.
- **Inspections** — the paper sheet, digital: tires (/32), brakes (mm + rotor), suspension, alignment (ALG 79–120), TPMS; auto green/yellow/red; previous-visit tread comparison; note templates; validation warnings; live customer preview; CSV export.
- **Photos & Video** — phone camera upload, filed by category + corner, shown on reports and vehicle history.
- **Customers** — search name/phone/plate; segments (VIP / New / Returning / At-risk); lifetime + awaiting value; open recommendations; full 360° detail (vehicles, visits, texts, media).
- **Vehicles** — health dots from latest inspection, due-for-service badges (6 mo / 6k mi / findings), make filter, sort, quick work-order + report links.
- **Estimates** — auto-built from findings (parts + labor + MA tax); pipeline funnel; stale follow-ups; templates; discount/deposit/balance; per-line approve; text + phone-approval logging.
- **Expenses** — admin money tracker: income in vs expenses out, net kept, 14-day cash-flow bars, category donuts, add/edit/delete + CSV export. Dashboard shows a 30-day snapshot.
- **Messages** — every text logged with report/estimate link cards; quick replies; SMS deep-links to the Messages app.
- **Reports** — ready/sent inbox with send-rate, funnel to approval, oldest-unsent nudge, preview + printable sheet + copy-link.
- **Settings** — shop profile, SMS templates (`{first} {vehicle} {total} {link}`), tread/pad thresholds, ALG labels, team, JSON/CSV export (your data, no lock-in), PWA install steps.

### The color system (the whole app in 4 dots)

- 🟢 **Good / OK** — no action · 🔵 **Future** — watch next visit · 🟡 **Soon** — plan it · 🔴 **Replace / Now** — unsafe, fix today. Thresholds editable in Settings.

---

## Quickstart (local)

```bash
npm install
npm run dev        # http://localhost:3000 → /login
npm run build && npm start   # production check
```

Type/lint gates: `npx next typegen` · `npm exec tsc -- --noEmit` · `npm run build`.

---

## Deploy to Vercel (2 minutes, no env vars)

1. Push this repo to GitHub.
2. vercel.com → **Add New → Project** → import it (Next.js auto-detected).
3. **Add zero environment variables** → **Deploy**.

> **Seen “Ambiguous app routes … /r/[code] … /r/[reportId]”?** Your repo has first-version leftovers from upload-on-top. Delete `src/app/r/[reportId]/`, old `src/components/{job-board,inspection-form,customer-search,share-report,media-library}.tsx`, and `src/db/index.ts`. As a safety net, `next.config.ts` also removes recognizable old copies automatically at build time.

### Vercel: `finance.ts` has no exported member `ExpenseCategory`

This is a source-file mismatch, not an installation, database, or cache failure.
The obsolete `src/lib/finance.ts` imports `ExpenseCategory` and `ExpenseEntry`
from an older model. The current app uses `ExpenseTransaction`; its finance
calculations live in `src/lib/insights.ts`. TypeScript checks unused source files
as well, so that leftover helper alone can fail the deployment.

1. Replace **`next.config.ts`** in GitHub with the current file. It now removes
   `src/lib/finance.ts` when it detects those retired type imports, before Next.js
   scans routes or runs TypeScript. A modern finance helper is left untouched.
2. Recommended: also delete **`src/lib/finance.ts`** from the repository. Uploading
   new files on top of an old repository does not record file deletions.
3. Commit and deploy the **new commit**. Redeploying the old failed commit still
   uses the old cleanup rules. No environment variables are needed.

Do not disable TypeScript checking or add placeholder types to `data.ts`.
The npm `install-scripts` warnings are not the reported cause of this failure.

Health: `GET /api/health` → `{ "ok": true, "mode": "demo", "database": "none" }`.

## If a page says “This page couldn’t load”

One reproduced cause was an incomplete browser save: the store trusted parsed JSON,
then the dashboard called `.filter()` on a missing or null jobs list. The current
app validates all persisted collections and nested inspection records before use.

- Healthy v3 demo saves migrate to v4 without discarding valid records.
- Damaged saves are repaired collection-by-collection; the original is backed up
  in `castle-tire-demo-recovery-backup` when browser storage permits.
- A blue recovery notice offers **Download the original save**.
- If an embedded/private browser blocks storage, the app continues in memory and
  shows **Session-only demo mode**. No database is needed.
- Unexpected route errors now show **Try again**, **Reload app**, and a confirmed
  **Restore sample data** option. Reloading does not intentionally clear data.

If the message appears in the ChatGPT preview wrapper before the app renders,
reopen the latest preview or open its URL in a separate browser tab. The wrapper
is outside this application. For Vercel, deploy the latest files and reload the
page to fetch the current JavaScript bundles.

### Regression checks

Pure saved-data tests (no browser or server required):

```bash
npx --yes esbuild tests/demo-storage.test.ts --bundle --platform=node --format=cjs --outfile=/tmp/castle-demo-tests.cjs
node --test /tmp/castle-demo-tests.cjs
```

Legacy deployment cleanup tests (also no browser or server required):

```bash
npx --yes esbuild tests/legacy-cleanup.test.ts --bundle --platform=node --format=cjs --outfile=/tmp/castle-legacy-tests.cjs
node --test /tmp/castle-legacy-tests.cjs
```

These cover the deployed obsolete finance helper, multiline imports, preservation
of modern helpers, and the old duplicate report route.

Browser checks require a running app at `http://localhost:3000`. Playwright is
used only for testing, not by the deployed app:

```bash
npx --yes playwright install --with-deps chromium
npx --yes --package playwright -c 'PLAYWRIGHT_MODULE="$(dirname "$(realpath "$(command -v playwright)")")" node scripts/browser-smoke.cjs'
```

The browser suite checks login, all major pages, expense persistence, tour restart,
corrupted/legacy saves, blocked storage, and invalid cross-tab updates.

---

## Install as an app (PWA)

- **iPhone/iPad:** Safari → Share → **Add to Home Screen**.
- **Android:** Chrome → ⋮ → **Install app**.
- **Windows:** Edge/Chrome → install icon in the address bar.

Phone-first bits: bottom `+` = New Vehicle anywhere; big tread/pad fields; camera buttons open the rear camera; bottom tabs for Home/Jobs/Inspect/Messages.

---

## Tech (boring, ownable, no lock-in)

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript strict · Tailwind CSS 4 · lucide-react · Pexels stock. No UI framework, no backend vendor. See **[PROJECT.md](./PROJECT.md)** for architecture, data model, inspection math, and the production roadmap (Postgres + Drizzle, S3, Twilio, real auth).

```
src/app/(app)/*     dashboard jobs inspections media customers vehicles estimates expenses messages reports guide settings
src/app/r/[code]    public customer report (no login)
src/components      brand ui analytics onboarding inspection-extras photo-capture send-report-modal …
src/lib             data (types) · seed (dummy data) · store (actions) · utils (rules) · insights (analytics)
```

## FAQ

- **Real data?** No — dummy data in your browser only. Other devices won't see your edits until a backend is added (seeded `/r/…` links are the exception).
- **Do texts really send?** They open your SMS app pre-filled and log in Messages. Auto-send needs Twilio (roadmap).
- **Photos persistent?** Compressed photos persist; videos are session-only in the demo.
- **Can I break it?** Please try. **Settings → Reset demo data** fixes everything.
