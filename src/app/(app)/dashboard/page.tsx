"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BadgeDollarSign,
  Bell,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  MessageSquare,
  Plus,
  Receipt,
  Send,
  TrendingUp,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import { Donut, MiniBars, StatCard } from "@/components/analytics";
import { ChecklistCard, FirstRunBanner, HelpTip, useOnboarding, useTourState } from "@/components/onboarding";
import { Avatar, Card, JobStatusBadge, PageHeader, PlateBadge, ProgressBar } from "@/components/ui";
import { useMe, useShop } from "@/lib/store";
import {
  activityFeed,
  dashboardAlerts,
  expenseSummary,
  techLeaderboard,
  todayRevenue,
  weeklyTrend,
} from "@/lib/insights";
import {
  byId,
  estimateTotals,
  fmtDate,
  fmtTime,
  firstName,
  jobGroup,
  money,
  relStamp,
  slotMinutes,
  vehicleLabel,
  vehiclePhoto,
} from "@/lib/utils";

export default function DashboardPage() {
  const state = useShop();
  const me = useMe();
  const today = state.anchorDay;
  const { done, finished } = useOnboarding();
  const { start } = useTourState();
  const [showAllFeed, setShowAllFeed] = useState(false);

  const todays = state.jobs.filter((j) => j.date === today).sort((a, b) => slotMinutes(a.time) - slotMinutes(b.time));
  const waiting = todays.filter((j) => j.status === "waiting");
  const progress = todays.filter((j) => jobGroup(j.status) === "progress");
  const completed = todays.filter((j) => j.status === "completed");
  const alerts = dashboardAlerts(state);
  const revenue = todayRevenue(state);
  const trend = weeklyTrend(state);
  const feed = activityFeed(state, showAllFeed ? 20 : 8);
  const leaders = techLeaderboard(state).sort((a, b) => b.revenue - a.revenue);
  const awaiting = state.estimates.filter((e) => e.status === "sent");
  const monthMoney = expenseSummary(state, "month");

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const firstWaiting = waiting[0];
  const inInspection = todays.find((j) => j.status === "inspection" || j.status === "accepted");
  const inspected = todays.find((j) => j.status === "inspection_complete") ?? todays.find((j) => j.status !== "waiting");
  const steps = [
    { n: 1, title: "Create a New Vehicle", text: "Customer, vehicle & complaint", href: "/jobs/new" },
    { n: 2, title: "Today's Jobs", text: "Waiting · In Progress · Completed", href: "/jobs" },
    { n: 3, title: "Technician Accepts Job", text: firstWaiting ? `Try ${firstWaiting.id}` : "Accept from the job card", href: firstWaiting ? `/jobs/${firstWaiting.id}` : "/jobs" },
    { n: 4, title: "Digital Inspection", text: "Tires, brakes, suspension, alignment, TPMS", href: inInspection ? `/inspections/${inInspection.id}` : "/inspections" },
    { n: 5, title: "Add Photos & Measurements", text: "Tap the camera on any tire", href: inInspection ? `/inspections/${inInspection.id}` : "/media" },
    { n: 6, title: "Inspection Complete", text: "Send to customer · Create estimate", href: inspected ? `/inspections/${inspected.id}/complete` : "/reports" },
  ];

  const pct = (completed.length / Math.max(todays.length, 1)) * 100;
  const totalAlerts = alerts.unassigned.length + alerts.readyReports.length + alerts.staleEstimates.length + alerts.redNotContacted.length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={fmtDate(today, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        title={
          <span>
            {greeting}, {firstName(me.name)}
            <HelpTip title="Your morning briefing">
              Everything you need before the first car rolls in: who is waiting, what needs a text, and how today&apos;s money looks. New? Take the tour below.
            </HelpTip>
          </span>
        }
        subtitle="Here's the shop floor right now."
        actions={
          <>
            <button type="button" onClick={start} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50">
              <Compass className="size-4" /> Tour
            </button>
            <Link href="/jobs/new" className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-700">
              <Plus className="size-4" /> New Vehicle
            </Link>
            <Link href="/jobs" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:bg-slate-50">
              Today&apos;s Jobs <ArrowRight className="size-4" />
            </Link>
          </>
        }
      />

      <FirstRunBanner onTour={start} onGuide="/guide" />
      {finished < 6 && <ChecklistCard done={done} finished={finished} />}

      {/* Money row */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Approved today" value={money(revenue.approvedTotal)} hint={`${revenue.approvedCount} jobs · avg ${money(revenue.avgTicket)}`} tone="text-emerald-600" icon={<BadgeDollarSign className="size-4 text-emerald-500" />} />
        <StatCard label="Awaiting approval" value={money(revenue.awaitingTotal)} hint={`${awaiting.length} estimates out`} tone="text-amber-600" icon={<Receipt className="size-4 text-amber-500" />} />
        <StatCard label="Vehicles today" value={String(todays.length)} hint={`${todays.filter((j) => !j.assignedTo).length} unassigned`} icon={<Wrench className="size-4 text-slate-400" />} />
        <StatCard label="Needs attention" value={String(totalAlerts)} hint={totalAlerts === 0 ? "All caught up 🎉" : "Across jobs + texts"} tone={totalAlerts ? "text-brand-600" : "text-emerald-600"} icon={<Bell className="size-4 text-brand-500" />} />
      </div>

      {/* Shop money snapshot */}
      <Link
        href="/expenses"
        className="anim-fade-up flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl bg-slate-950 p-4 text-white shadow-lg transition hover:-translate-y-0.5 sm:px-5"
      >
        <span className="flex items-center gap-2 text-sm font-bold">
          <Wallet className="size-4 text-emerald-400" /> Shop money · 30 days
        </span>
        <span className="text-sm"><span className="text-emerald-400">↓ {money(monthMoney.income)}</span> <span className="text-slate-400">in</span></span>
        <span className="text-sm"><span className="text-red-400">↑ {money(monthMoney.expense)}</span> <span className="text-slate-400">out</span></span>
        <span className="text-sm font-bold">Net {money(monthMoney.net)}</span>
        <span className="ml-auto flex items-center gap-1 text-xs font-bold text-slate-300">Open expenses <ArrowRight className="size-4" /></span>
      </Link>

      {/* Workflow strip — responsive grid on desktop, swipeable carousel with arrows on phones */}
      <WorkflowStrip steps={steps} />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {[
          { label: "Waiting", value: waiting.length, hint: "Ready to accept", tone: "text-amber-600" },
          { label: "In progress", value: progress.length, hint: "Inspection → approval", tone: "text-blue-600" },
          { label: "Completed", value: completed.length, hint: `${state.media.filter((m) => m.takenAt.startsWith(today)).length} photos & videos today`, tone: "text-emerald-600" },
          { label: "Reports texted", value: state.reports.filter((r) => r.sentAt).length, hint: `${state.reports.filter((r) => !r.sentAt).length} ready to send`, tone: "text-slate-950" },
        ].map((s, i) => (
          <Card key={s.label} className="anim-fade-up p-4 sm:p-5">
            <div style={{ animationDelay: `${0.1 + i * 0.06}s` }}>
              <p className="text-xs font-medium text-slate-500">{s.label}</p>
              <p className={`mt-2 text-3xl font-bold tracking-tight ${s.tone}`}>{s.value}</p>
              <p className="mt-1 text-xs text-slate-500">{s.hint}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card className="anim-fade-up">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="font-semibold text-slate-950">Today&apos;s schedule</h3>
                <p className="text-xs text-slate-500">{Math.round(pct)}% complete · {completed.length}/{todays.length} vehicles</p>
              </div>
              <Link href="/jobs" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700">
                All jobs <ArrowRight className="size-4" />
              </Link>
            </div>
            <div className="px-5 pt-3"><ProgressBar value={pct} /></div>
            <ul className="divide-y divide-slate-100">
              {todays.slice(0, 6).map((job) => {
                const customer = byId(state.customers, job.customerId);
                const vehicle = byId(state.vehicles, job.vehicleId);
                const tech = byId(state.team, job.assignedTo);
                if (!customer || !vehicle) return null;
                return (
                  <li key={job.id}>
                    <Link href={`/jobs/${job.id}`} className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-slate-50/80">
                      <img src={vehiclePhoto(vehicle)} alt="" className="h-12 w-16 shrink-0 rounded-lg object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900">{vehicleLabel(vehicle)}</p>
                        <p className="truncate text-xs text-slate-500">{customer.name} · {job.complaint}</p>
                      </div>
                      <div className="hidden flex-col items-end gap-1 sm:flex"><PlateBadge plate={vehicle.plate} /></div>
                      <div className="flex w-28 flex-col items-end gap-1">
                        <JobStatusBadge status={job.status} />
                        <span className="flex items-center gap-1 text-[11px] text-slate-500">
                          <Clock className="size-3" /> {job.time}
                          {tech && <span className="ml-1 font-semibold text-slate-700">{tech.name.split(" ")[0]}</span>}
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
            {todays.length > 6 && (
              <Link href="/jobs" className="block border-t border-slate-100 px-5 py-3 text-center text-sm font-bold text-blue-600 hover:bg-slate-50">
                + {todays.length - 6} more vehicles today →
              </Link>
            )}
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="anim-fade-up p-5">
              <h3 className="flex items-center gap-2 font-semibold text-slate-950"><TrendingUp className="size-4 text-brand-600" /> Last 7 days</h3>
              <p className="text-xs text-slate-500">Jobs per day · hover for revenue</p>
              <div className="mt-4">
                <MiniBars data={trend.map((t) => ({ label: t.label, value: t.jobs }))} valueLabel={(v) => `${v} jobs`} />
              </div>
              <p className="mt-3 text-xs text-slate-500">
                7-day revenue (approved): <b className="text-slate-900">{money(trend.reduce((s, t) => s + t.revenue, 0))}</b>
              </p>
            </Card>
            <Card className="anim-fade-up p-5">
              <h3 className="font-semibold text-slate-950">Shop load</h3>
              <p className="text-xs text-slate-500">Where today&apos;s cars sit</p>
              <div className="mt-4">
                <Donut
                  parts={[
                    { value: waiting.length, color: "#f59e0b", label: "Waiting" },
                    { value: progress.length, color: "#2563eb", label: "In progress" },
                    { value: completed.length, color: "#10b981", label: "Completed" },
                  ]}
                />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                <Link href="/inspections" className="rounded-xl bg-slate-50 p-2.5 text-xs font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100">Open inspections</Link>
                <Link href="/reports" className="rounded-xl bg-slate-50 p-2.5 text-xs font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100">Send reports</Link>
              </div>
            </Card>
          </div>

          <Card className="anim-fade-up p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-950">Live activity</h3>
              <button type="button" onClick={() => setShowAllFeed((v) => !v)} className="text-xs font-bold text-blue-600 hover:underline">
                {showAllFeed ? "Show less" : "Show more"}
              </button>
            </div>
            <ol className="relative mt-4 space-y-0 border-l-2 border-slate-100 pl-4">
              {feed.map((f) => (
                <li key={f.id} className="relative pb-4 last:pb-0">
                  <span className={`absolute -left-[21px] top-1 size-2.5 rounded-full ring-2 ring-white ${f.kind === "job" ? "bg-blue-500" : f.kind === "message" ? "bg-emerald-500" : f.kind === "estimate" ? "bg-amber-400" : "bg-brand-500"}`} />
                  <Link href={f.href} className="block rounded-lg p-1 transition hover:bg-slate-50">
                    <p className="text-sm font-semibold text-slate-900">{f.title}</p>
                    <p className="truncate text-xs text-slate-500">{f.detail}</p>
                    <p className="text-[11px] text-slate-400">{relStamp(f.at, today)}</p>
                  </Link>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="anim-fade-up border-l-4 border-l-brand-500 p-5">
            <h3 className="flex items-center gap-2 font-semibold text-slate-950">
              <AlertTriangle className="size-4 text-brand-600" /> Needs attention · {totalAlerts}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {alerts.redNotContacted.map((j) => {
                const c = byId(state.customers, j.customerId);
                return (
                  <li key={j.id}>
                    <Link href={`/inspections/${j.id}/complete`} className="flex items-start gap-3 rounded-xl bg-red-50 p-3 ring-1 ring-red-200 transition hover:bg-red-100/70">
                      <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-600" />
                      <span className="text-sm"><span className="font-bold text-red-900">Red findings — contact now</span><span className="block text-red-700">{c?.name} · {j.id}</span></span>
                    </Link>
                  </li>
                );
              })}
              {alerts.readyReports.slice(0, 3).map((r) => {
                const job = byId(state.jobs, r.jobId);
                const customer = job ? byId(state.customers, job.customerId) : undefined;
                return (
                  <li key={r.code}>
                    <Link href={`/inspections/${r.jobId}/complete`} className="flex items-start gap-3 rounded-xl bg-blue-50 p-3 ring-1 ring-blue-100 transition hover:bg-blue-100/70">
                      <Send className="mt-0.5 size-5 shrink-0 text-blue-600" />
                      <span className="text-sm"><span className="font-semibold text-slate-900">Inspection ready to send</span><span className="block text-slate-600">{customer?.name} · {r.jobId}</span></span>
                    </Link>
                  </li>
                );
              })}
              {alerts.staleEstimates.map((e) => {
                const job = byId(state.jobs, e.jobId);
                const customer = job ? byId(state.customers, job.customerId) : undefined;
                return (
                  <li key={e.id}>
                    <Link href={`/estimates/${e.id}`} className="flex items-start gap-3 rounded-xl bg-amber-50 p-3 ring-1 ring-amber-200 transition hover:bg-amber-100/70">
                      <Receipt className="mt-0.5 size-5 shrink-0 text-amber-600" />
                      <span className="text-sm"><span className="font-semibold text-slate-900">Estimate going cold — follow up</span><span className="block text-slate-600">{customer?.name} · {money(estimateTotals(e, state.settings.taxRate).total, true)}</span></span>
                    </Link>
                  </li>
                );
              })}
              {alerts.unassigned.length > 0 && (
                <li>
                  <Link href="/jobs" className="flex items-start gap-3 rounded-xl bg-brand-50 p-3 ring-1 ring-brand-100 transition hover:bg-brand-100/60">
                    <Users className="mt-0.5 size-5 shrink-0 text-brand-600" />
                    <span className="text-sm"><span className="font-semibold text-slate-900">{alerts.unassigned.length} waiting for a tech</span><span className="block text-slate-600">Accept a job from Today&apos;s Jobs</span></span>
                  </Link>
                </li>
              )}
              {totalAlerts === 0 && (
                <li className="flex items-center gap-2 text-sm text-emerald-700"><CheckCircle2 className="size-4" /> All caught up</li>
              )}
            </ul>
          </Card>

          <Card className="anim-fade-up p-5">
            <h3 className="font-semibold text-slate-950">Tech leaderboard</h3>
            <p className="text-xs text-slate-500">Approved revenue · all time dummy data</p>
            <ul className="mt-4 space-y-3">
              {leaders.map(({ member, todayJobs, completed: done, inspections, revenue: rev }, i) => (
                <li key={member.id} className="flex items-center gap-3">
                  <span className={`grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-black ${i === 0 ? "bg-amber-400 text-slate-950" : "bg-slate-100 text-slate-500"}`}>{i + 1}</span>
                  <Avatar initials={member.initials} tone={member.id === me.id ? "brand" : "dark"} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{member.name}</p>
                    <p className="truncate text-xs text-slate-500">{todayJobs} today · {done} done · {inspections} insp.</p>
                  </div>
                  <span className="text-sm font-bold text-emerald-700">{money(rev)}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="anim-fade-up p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-950">Recent texts</h3>
              <Link href="/messages" className="text-sm font-semibold text-blue-600">Messages</Link>
            </div>
            <ul className="mt-4 space-y-3">
              {[...state.messages].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 4).map((m) => {
                const c = byId(state.customers, m.customerId);
                return (
                  <li key={m.id} className="flex items-start gap-3">
                    <span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-full ${m.direction === "in" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
                      <MessageSquare className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{m.direction === "in" ? c?.name : `To ${c?.name}`}</p>
                      <p className="line-clamp-1 text-xs text-slate-500">{m.body}</p>
                      <p className="text-[11px] text-slate-400">{relStamp(m.at, today)} · {fmtTime(m.at)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card className="anim-fade-up bg-gradient-to-br from-blue-600 to-blue-800 p-5 text-white">
            <h3 className="font-bold">Quick actions</h3>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm font-bold">
              <Link href="/jobs/new" className="rounded-xl bg-white/15 p-3 ring-1 ring-white/20 transition hover:bg-white/25"><Plus className="size-4" /> New job</Link>
              <Link href="/inspections" className="rounded-xl bg-white/15 p-3 ring-1 ring-white/20 transition hover:bg-white/25"><Wrench className="size-4" /> Inspect</Link>
              <Link href="/estimates" className="rounded-xl bg-white/15 p-3 ring-1 ring-white/20 transition hover:bg-white/25"><Receipt className="size-4" /> Estimate</Link>
              <Link href="/expenses" className="rounded-xl bg-white/15 p-3 ring-1 ring-white/20 transition hover:bg-white/25"><Wallet className="size-4" /> Expenses</Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

type Step = { n: number; title: string; text: string; href: string };

function StepCard({ s, last }: { s: Step; last?: boolean }) {
  return (
    <Link
      href={s.href}
      className="group flex h-full min-h-[92px] items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-600 text-sm font-black text-white shadow-sm shadow-brand-600/30">
        {s.n}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold leading-snug text-slate-900">{s.title}</span>
        <span className="mt-0.5 block text-xs leading-snug text-slate-500">{s.text}</span>
      </span>
      {!last && <ArrowRight className="mt-1 hidden size-4 shrink-0 text-blue-500 lg:block" />}
    </Link>
  );
}

function WorkflowStrip({ steps }: { steps: Step[] }) {
  const trackRef = useRef<HTMLOListElement>(null);
  const [page, setPage] = useState(0);
  const perView = 1;

  const scrollByCards = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("li");
    const w = card ? card.clientWidth + 12 : 240;
    el.scrollBy({ left: dir * w, behavior: "smooth" });
  };

  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("li");
    const w = card ? card.clientWidth + 12 : 240;
    setPage(Math.min(steps.length - perView, Math.max(0, Math.round(el.scrollLeft / w))));
  };

  const goTo = (i: number) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("li");
    const w = card ? card.clientWidth + 12 : 240;
    el.scrollTo({ left: i * w, behavior: "smooth" });
  };

  return (
    <Card className="anim-fade-up overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-5">
        <h2 className="min-w-0 truncate font-semibold text-slate-950">
          Shop workflow
          <HelpTip title="How a car flows">
            Every vehicle follows these 6 steps. Tap any step to jump to a live example with dummy data.
          </HelpTip>
        </h2>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 md:hidden">
            {Math.min(page + 1, steps.length)}/{steps.length}
          </span>
          <div className="flex gap-1.5 md:hidden">
            <button
              type="button"
              onClick={() => scrollByCards(-1)}
              disabled={page <= 0}
              aria-label="Previous workflow step"
              className="grid size-9 place-items-center rounded-full bg-slate-950 text-white shadow transition active:scale-95 disabled:opacity-30"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollByCards(1)}
              disabled={page >= steps.length - perView}
              aria-label="Next workflow step"
              className="grid size-9 place-items-center rounded-full bg-brand-600 text-white shadow transition active:scale-95 disabled:opacity-30"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
          <Link href="/guide" className="hidden text-xs font-bold text-blue-600 hover:underline sm:inline">
            Newcomer guide →
          </Link>
        </div>
      </div>

      {/* Phones: swipeable carousel, one full card at a time */}
      <div className="md:hidden">
        <ol ref={trackRef} onScroll={onScroll} className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth p-4">
          {steps.map((s, i) => (
            <li key={s.n} className="w-[82%] shrink-0 snap-center">
              <StepCard s={s} last={i === steps.length - 1} />
            </li>
          ))}
        </ol>
        <div className="flex items-center justify-center gap-1.5 pb-4">
          {steps.map((s, i) => (
            <button
              key={s.n}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to step ${s.n}: ${s.title}`}
              className={`h-2 rounded-full transition-all ${i === page ? "w-6 bg-brand-600" : "w-2 bg-slate-200 hover:bg-slate-300"}`}
            />
          ))}
        </div>
      </div>

      {/* Tablets + desktop: every step visible, no scrolling needed */}
      <ol className="hidden gap-3 p-4 md:grid md:grid-cols-2 lg:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.n}>
            <StepCard s={s} last={i === steps.length - 1} />
          </li>
        ))}
      </ol>
    </Card>
  );
}


