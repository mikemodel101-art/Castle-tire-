# Castle Tire Shop SaaS Demo - Product & Feature Map

## Purpose
A simple, mobile-friendly shop operations system for a tire and repair business.
This demo is intentionally database-free and runs on dummy data stored in the browser.

## Current demo architecture
- **Frontend:** Next.js App Router + React + TypeScript + Tailwind CSS
- **State model:** in-browser store (`src/lib/store.tsx`) with seeded demo data (`src/lib/seed.ts`)
- **Media:** browser-stored demo photos / videos plus stock Pexels assets
- **Public sharing:** customer report routes under `/r/[code]`
- **No database connection**

## Main user roles
- **Manager / owner**
  - creates work orders
  - watches today's shop load
  - sends reports and estimates
  - manages team / settings
- **Technician**
  - accepts jobs
  - performs digital inspections
  - uploads media
  - completes inspection findings
- **Customer**
  - views public inspection report
  - reviews photos / videos
  - approves estimate recommendations

## Main product areas
1. **Dashboard**
   - shop KPIs
   - workflow steps
   - attention alerts
   - recent customer communication
   - team activity

2. **Today's Jobs**
   - Waiting / In Progress / Completed views
   - vehicle photos and shop-ready cards
   - quick job understanding for new users

3. **New Work Order / Check-in**
   - customer lookup by phone
   - vehicle lookup and reuse
   - complaint capture with quick chips

4. **Job Detail**
   - customer + vehicle context
   - timeline of job progress
   - inspection and media entry point
   - report / estimate shortcuts

5. **Inspection System**
   - step-by-step technician flow
   - measurements based on the paper inspection sheet
   - camera capture attached to each section
   - printable / shareable filled-out sheet

6. **Inspection Complete**
   - shop summary
   - customer-ready summary
   - report sending
   - estimate creation

7. **Estimates**
   - estimate list
   - line-item editing
   - parts / labor / tax totals
   - customer approval states

8. **Customers**
   - search by name / phone / plate
   - full history
   - open recommendations
   - text history

9. **Vehicles**
   - vehicle-centric history
   - last known inspection status
   - quick access to create a new work order

10. **Reports**
   - manager-facing report queue
   - resend / preview / copy link
   - public customer report pages

11. **Messages**
   - single place for outgoing / incoming text records
   - report and estimate links visible in context

12. **Settings**
   - shop branding / standards / templates / team
   - export / reset demo data
   - ownership / no vendor lock-in messaging

## Important product principles
- easy for first-time users
- minimal training required
- phone-first workflow for technicians
- no app required for customers
- standard, ownable stack with no vendor lock-in
- future-ready for PostgreSQL, cloud storage and SMS integrations

## Suggested future production upgrades
- PostgreSQL persistence
- cloud object storage for media
- Twilio or similar SMS delivery
- auth with real users and permissions
- audit trail / activity log
- search filters by date / tech / status
- invoices and payment status
- appointment calendar
- parts / tire inventory
- customer signatures
- PDF export of estimate and report
