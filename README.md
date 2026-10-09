# Castle Tire Shop · Shop Operations (demo)

Cloud-ready Progressive Web App for daily shop work: work orders, today's jobs,
technician accept/claim, digital inspections based on the Castle paper sheet,
photos & short videos, customer text reports, estimates, messages and full
customer / vehicle history. Works on Windows PCs, iPhone, Android and tablets.

## New user quick start

1. **Sign in** with one of the demo logins below.
2. Open **Dashboard** to see the workflow strip, quick-start guide and live shop load.
3. Use **New Vehicle** to create a work order.
4. Open **Today's Jobs** and accept a waiting vehicle.
5. Run the **Inspection** step-by-step and add photos.
6. Finish on **Inspection Complete** to send the report and create the estimate.
7. Use **Customers**, **Vehicles**, **Messages**, **Reports** and **Estimates** to review history and follow up.

## Expanded feature set

### Dashboard
- onboarding workflow strip for new employees
- quick-start guidance and role-specific tips
- live counts for waiting, active and completed work
- ready-to-send reports and pending estimate alerts
- recent customer message activity
- team-on-shift overview

### Today's Jobs
- clearer Waiting / In Progress / Completed explanations
- faster filters for My Jobs and all-day view
- stronger vehicle cards with photo, plate and assigned technician
- easier new-user understanding of the job flow

### Inspections
- section guidance for Tires / Brakes / TPMS / Suspension / Alignment
- step-by-step wizard based on the Castle paper sheet
- better newcomer help while entering measurements
- stronger complete-summary handoff screen
- printable filled-out inspection sheet

### Estimates
- estimate list with workflow explanations
- line-level approve / decline controls
- totals, tax and approved-work tracking
- stronger customer texting workflow

### Customers & Vehicles
- easier history lookup by customer or by vehicle
- richer customer detail view with open recommendations and communication history
- vehicle-centric service history and report shortcuts

### Reports
- manager-facing report queue
- resend, preview, sheet view and link copy actions
- better customer-facing explanations inside the public report

For a more detailed internal product map, see **PROJECT.md**.

## Demo mode: no database

- The app runs **100% on dummy data** (`src/lib/seed.ts`). Nothing connects to a
  database and **no environment variables are needed**.
- Changes (new work orders, inspections, photos, estimates, texts) are saved in
  the browser (localStorage). Reset anytime: **Settings → Reset demo data**.
- Seeded customer reports (e.g. `/r/K7Q2XM`) open on any device. Reports created
  during the demo open in the browser that created them. Sharing them
  across devices needs a real backend (planned production step).

## Demo logins (autofill buttons on the login page)

| Role       | Email                  | Password   |
| ---------- | ---------------------- | ---------- |
| Manager    | admin@castletire.com   | Castle2026 |
| Technician | tech@castletire.com    | Tech2026   |

## Deploy to Vercel

1. Push this project to a GitHub repository.
2. On vercel.com: **Add New → Project →** import the repo.
   Framework preset: **Next.js** (auto-detected). Leave build settings as default.
3. **Do not add any environment variables.** Click **Deploy**.

### Fixing "Ambiguous app routes … /r/[code] … /r/[reportId]"

Uploading a new version to GitHub on top of an older one keeps old files around.
Delete these leftovers from the repository (they are no longer used):

- `src/app/r/[reportId]/` (whole folder)
- `src/components/job-board.tsx`
- `src/components/inspection-form.tsx`
- `src/components/customer-search.tsx`
- `src/components/share-report.tsx`
- `src/components/media-library.tsx`
- `src/db/index.ts` (old database connection, unused)

As a safety net, `next.config.ts` removes old copies of the first six
automatically at build time, so the deploy succeeds even if they're still there.
When updating the repo later, replace the files instead of uploading on top.

## Tech stack (no vendor lock-in)

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · lucide icons.
Standard, open-source tools any developer can take over. Stock photos from Pexels.

## Project map

- `src/app/login`: animated login with demo autofill
- `src/app/(app)`: dashboard, jobs, inspections, media, customers, vehicles,
  estimates, messages, reports, settings
- `src/app/r/[code]`: customer-facing report (no login, no app needed)
- `src/lib/seed.ts`: dummy data · `src/lib/store.tsx`: in-browser demo store
- `src/lib/utils.ts`: inspection rules (Good / Soon / Replace), estimates, helpers
