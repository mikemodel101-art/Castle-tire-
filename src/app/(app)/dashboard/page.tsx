"use client";

import Link from "next/link";
import { useRef } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, Clock, MessageSquare, Plus, Receipt, Send, ShieldCheck, Star, Wallet } from "lucide-react";
import { Avatar, Card, JobStatusBadge, JourneyCard, OnboardingBanner, PageHeader, PlateBadge, ProgressBar } from "@/components/ui";
import { netCashflow, sumByType } from "@/lib/finance";
import { DASHBOARD_QUICKSTART } from "@/lib/help";
import { useMe, useShop } from "@/lib/store";
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

  const todays = state.jobs.filter((j) => j.date === today).sort((a, b) => slotMinutes(a.time) - slotMinutes(b.time));
  const waiting = todays.filter((j) => j.status === "waiting");
  const progress = todays.filter((j) => jobGroup(j.status) === "progress");
  const completed = todays.filter((j) => j.status === "completed");
  const readyReports = state.reports.filter((r) => !r.sentAt);
  const awaiting = state.estimates.filter((e) => e.status === "sent");
  const recent = [...state.messages].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 4);
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

  const stats = [
    { label: "Vehicles today", value: todays.length, hint: `${todays.filter((j) => !j.assignedTo).length} unassigned`, tone: "text-slate-950" },
    { label: "Waiting", value: waiting.length, hint: "Ready to accept", tone: "text-amber-600" },
    { label: "In progress", value: progress.length, hint: "Inspection → approval", tone: "text-blue-600" },
    { label: "Completed", value: completed.length, hint: `${state.media.filter((m) => m.takenAt.startsWith(today)).length} photos & videos today`, tone: "text-emerald-600" },
  ];
  const pct = (completed.length / Math.max(todays.length, 1)) * 100;
  const assignedToMe = todays.filter((j) => j.assignedTo === me.id && j.status !== "completed");
  const openInspections = state.inspections.filter((i) => !i.completedAt && todays.some((j) => j.id === i.jobId)).length;
  const estimateValue = awaiting.reduce((sum, e) => sum + estimateTotals(e, state.settings.taxRate).total, 0);
  const todaysMoney = state.expenses.filter((x) => x.date === today);
  const todaysIncome = sumByType(todaysMoney, "income");
  const todaysOutgoing = sumByType(todaysMoney, "expense");
  const totalNet = netCashflow(state.expenses);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={fmtDate(today, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        title={`${greeting}, ${firstName(me.name)}`}
        subtitle="Here's the shop floor right now."
        actions={
          <>
            <Link href="/jobs/new" className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-700">
              <Plus className="size-4" /> New Vehicle
            </Link>
            <Link href="/jobs" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:bg-slate-50">
              Today&apos;s Jobs <ArrowRight className="size-4" />
            </Link>
          </>
        }
      />

      <OnboardingBanner
        title="A new employee can learn the system in one shift"
        text="Castle Tire is designed to follow the real shop flow: check in the car, accept the job, inspect it, add media, send the report and build the estimate. Use the workflow cards below in order."
        points={DASHBOARD_QUICKSTART}
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card className="anim-fade-up p-4">
          <div className="flex items-center gap-2 text-brand-700">
            <ShieldCheck className="size-4" />
            <p className="text-xs font-semibold uppercase tracking-wide">Role focus</p>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-950">{me.role}</p>
          <p className="mt-1 text-sm text-slate-600">
            {me.role.toLowerCase().includes("technician")
              ? "Start with Today's Jobs, accept your vehicle, then open the digital inspection."
              : "Start with the dashboard, create work orders, send reports and keep the queue moving."}
          </p>
        </Card>
        <Card className="anim-fade-up p-4">
          <div className="flex items-center gap-2 text-blue-700">
            <Star className="size-4" />
            <p className="text-xs font-semibold uppercase tracking-wide">Your focus today</p>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-950">{assignedToMe.length} active jobs</p>
          <p className="mt-1 text-sm text-slate-600">{openInspections} inspection{openInspections === 1 ? "" : "s"} still open · {awaiting.length} estimate{awaiting.length === 1 ? "" : "s"} waiting on approval.</p>
        </Card>
        <Card className="anim-fade-up p-4">
          <div className="flex items-center gap-2 text-emerald-700">
            <Receipt className="size-4" />
            <p className="text-xs font-semibold uppercase tracking-wide">Pending estimate value</p>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-950">{money(estimateValue, true)}</p>
          <p className="mt-1 text-sm text-slate-600">Work the customer has not yet approved.</p>
        </Card>
        <Card className="anim-fade-up p-4">
          <div className="flex items-center gap-2 text-sky-700">
            <Wallet className="size-4" />
            <p className="text-xs font-semibold uppercase tracking-wide">Cash today</p>
          </div>
          <p className={`mt-2 text-lg font-bold ${todaysIncome - todaysOutgoing >= 0 ? "text-emerald-700" : "text-red-700"}`}>{money(todaysIncome - todaysOutgoing, true)}</p>
          <p className="mt-1 text-sm text-slate-600">In {money(todaysIncome, true)} · Out {money(todaysOutgoing, true)} · Total net {money(totalNet, true)}</p>
        </Card>
      </div>

      <WorkflowCarousel steps={steps} />

      <div className="grid gap-3 lg:grid-cols-3">
        {steps.slice(0, 3).map((step) => (
          <JourneyCard key={step.n} index={step.n} title={step.title} text={step.text} tip={step.n === 1 ? "The phone number helps you find returning customers." : step.n === 2 ? "Use the tabs to switch between waiting and completed vehicles." : "A technician should accept the job before starting the inspection."} />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {stats.map((s, i) => (
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
        <Card className="anim-fade-up xl:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h3 className="font-semibold text-slate-950">Today&apos;s schedule</h3>
              <p className="text-xs text-slate-500">{Math.round(pct)}% complete</p>
            </div>
            <Link href="/jobs" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700">
              All jobs <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="px-5 pt-3">
            <ProgressBar value={pct} />
          </div>
          <ul className="divide-y divide-slate-100">
            {todays.map((job) => {
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
                      <p className="truncate text-xs text-slate-500">
                        {customer.name} · {job.complaint}
                      </p>
                    </div>
                    <div className="hidden flex-col items-end gap-1 sm:flex">
                      <PlateBadge plate={vehicle.plate} />
                    </div>
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
        </Card>

        <div className="space-y-6">
          <Card className="anim-fade-up p-5">
            <h3 className="font-semibold text-slate-950">Needs attention</h3>
            <ul className="mt-4 space-y-2.5">
              {readyReports.map((r) => {
                const job = byId(state.jobs, r.jobId);
                const customer = job ? byId(state.customers, job.customerId) : undefined;
                return (
                  <li key={r.code}>
                    <Link href={`/reports`} className="flex items-start gap-3 rounded-xl bg-blue-50 p-3 ring-1 ring-blue-100 transition hover:bg-blue-100/70">
                      <Send className="mt-0.5 size-5 shrink-0 text-blue-600" />
                      <span className="text-sm">
                        <span className="font-semibold text-slate-900">Inspection ready to send</span>
                        <span className="block text-slate-600">{customer?.name} · {r.jobId}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
              {awaiting.map((e) => {
                const job = byId(state.jobs, e.jobId);
                const customer = job ? byId(state.customers, job.customerId) : undefined;
                return (
                  <li key={e.id}>
                    <Link href={`/estimates/${e.id}`} className="flex items-start gap-3 rounded-xl bg-amber-50 p-3 ring-1 ring-amber-100 transition hover:bg-amber-100/70">
                      <Receipt className="mt-0.5 size-5 shrink-0 text-amber-600" />
                      <span className="text-sm">
                        <span className="font-semibold text-slate-900">Estimate awaiting approval</span>
                        <span className="block text-slate-600">
                          {customer?.name} · {money(estimateTotals(e, state.settings.taxRate).total, true)}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
              {waiting.filter((j) => !j.assignedTo).length > 0 && (
                <li>
                  <Link href="/jobs" className="flex items-start gap-3 rounded-xl bg-brand-50 p-3 ring-1 ring-brand-100 transition hover:bg-brand-100/60">
                    <AlertTriangle className="mt-0.5 size-5 shrink-0 text-brand-600" />
                    <span className="text-sm">
                      <span className="font-semibold text-slate-900">{waiting.filter((j) => !j.assignedTo).length} vehicles waiting for a tech</span>
                      <span className="block text-slate-600">Accept a job from Today&apos;s Jobs</span>
                    </span>
                  </Link>
                </li>
              )}
              {readyReports.length + awaiting.length === 0 && waiting.length === 0 && (
                <li className="flex items-center gap-2 text-sm text-emerald-700">
                  <CheckCircle2 className="size-4" /> All caught up
                </li>
              )}
            </ul>
          </Card>

          <Card className="anim-fade-up p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-950">Recent texts</h3>
              <Link href="/messages" className="text-sm font-semibold text-blue-600">Messages</Link>
            </div>
            <ul className="mt-4 space-y-3">
              {recent.map((m) => {
                const c = byId(state.customers, m.customerId);
                return (
                  <li key={m.id} className="flex items-start gap-3">
                    <span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-full ${m.direction === "in" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
                      <MessageSquare className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {m.direction === "in" ? c?.name : `To ${c?.name}`}
                      </p>
                      <p className="line-clamp-1 text-xs text-slate-500">{m.body}</p>
                      <p className="text-[11px] text-slate-400">{relStamp(m.at, today)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card className="anim-fade-up p-5">
            <h3 className="font-semibold text-slate-950">Team on shift</h3>
            <ul className="mt-4 space-y-3">
              {state.team.map((m) => {
                const active = todays.filter((j) => j.assignedTo === m.id && j.status !== "completed");
                const last = todays
                  .flatMap((j) => j.timeline)
                  .filter((t) => t.by === m.id)
                  .sort((a, b) => b.at.localeCompare(a.at))[0];
                return (
                  <li key={m.id} className="flex items-center gap-3">
                    <Avatar initials={m.initials} tone={m.id === me.id ? "brand" : "dark"} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{m.name}</p>
                      <p className="truncate text-xs text-slate-500">
                        {m.role}
                        {last ? ` · active ${fmtTime(last.at)}` : ""}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {active.length} open
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function WorkflowCarousel({
  steps,
}: {
  steps: { n: number; title: string; text: string; href: string }[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * 260, behavior: "smooth" });

  return (
    <Card className="anim-fade-up overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
        <h2 className="font-semibold text-slate-950">Shop workflow</h2>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-slate-500 sm:inline">Tap a step to walk through it</span>
          <button type="button" onClick={() => scroll(-1)} aria-label="Previous workflow step" className="grid size-8 place-items-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200">
            <ChevronLeft className="size-4" />
          </button>
          <button type="button" onClick={() => scroll(1)} aria-label="Next workflow step" className="grid size-8 place-items-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200">
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
      <div ref={ref} className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto p-4">
        {steps.map((s, i) => (
          <Link
            key={s.n}
            href={s.href}
            className="group flex min-h-[124px] w-[260px] shrink-0 snap-start items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md sm:w-[280px]"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-600 text-sm font-black text-white shadow-sm shadow-brand-600/30">
              {s.n}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold leading-tight text-slate-900">{s.title}</span>
              <span className="mt-1 block text-xs leading-relaxed text-slate-500">{s.text}</span>
            </span>
            {i < steps.length - 1 && <ArrowRight className="mt-1 hidden size-4 shrink-0 text-blue-500 sm:block" />}
          </Link>
        ))}
      </div>
      <div className="border-t border-slate-100 px-5 py-2 text-[11px] text-slate-500 sm:hidden">
        Swipe or use the arrows to see every workflow step.
      </div>
    </Card>
  );
}
