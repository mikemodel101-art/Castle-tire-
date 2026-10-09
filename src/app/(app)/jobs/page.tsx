"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarDays, Clock, Plus, Search, UserRound } from "lucide-react";
import { Avatar, Card, EmptyState, InfoPanel, JobStatusBadge, OnboardingBanner, PlateBadge } from "@/components/ui";
import type { Job } from "@/lib/data";
import { APP_JOURNEY } from "@/lib/help";
import { useMe, useShop } from "@/lib/store";
import { byId, digits, fmtDate, jobGroup, slotMinutes, vehicleLabel, vehiclePhoto, type JobGroup } from "@/lib/utils";

const TABS: { id: JobGroup; label: string; active: string; count: string; help: string }[] = [
  { id: "waiting", label: "Waiting", active: "border-amber-500 text-slate-950", count: "bg-amber-400 text-slate-950", help: "Front desk checked the vehicle in. A technician should accept it next." },
  { id: "progress", label: "In Progress", active: "border-blue-600 text-slate-950", count: "bg-blue-600 text-white", help: "The car is actively moving through inspection, customer contact, approval or repair." },
  { id: "completed", label: "Completed", active: "border-emerald-600 text-slate-950", count: "bg-emerald-600 text-white", help: "The work is done and the vehicle is ready for pickup or was already delivered." },
];

export default function TodaysJobsPage() {
  const state = useShop();
  const me = useMe();
  const [tab, setTab] = useState<JobGroup>("waiting");
  const [scope, setScope] = useState<"today" | "all">("today");
  const [mine, setMine] = useState(false);
  const [query, setQuery] = useState("");
  const today = state.anchorDay;

  const scoped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const qd = digits(query);
    return state.jobs
      .filter((j) => (scope === "today" ? j.date === today : true))
      .filter((j) => (mine ? j.assignedTo === me.id : true))
      .filter((j) => {
        if (!q) return true;
        const c = byId(state.customers, j.customerId);
        const v = byId(state.vehicles, j.vehicleId);
        return Boolean(
          c?.name.toLowerCase().includes(q) ||
            v?.plate.toLowerCase().includes(q.replace(/\s/g, "")) ||
            (v && vehicleLabel(v).toLowerCase().includes(q)) ||
            j.complaint.toLowerCase().includes(q) ||
            j.id.toLowerCase().includes(q) ||
            (qd.length >= 3 && c && digits(c.phone).includes(qd)),
        );
      });
  }, [state, scope, mine, query, today, me.id]);

  const counts: Record<JobGroup, number> = {
    waiting: scoped.filter((j) => jobGroup(j.status) === "waiting").length,
    progress: scoped.filter((j) => jobGroup(j.status) === "progress").length,
    completed: scoped.filter((j) => jobGroup(j.status) === "completed").length,
  };

  const visible = scoped
    .filter((j) => jobGroup(j.status) === tab)
    .sort((a, b) => b.date.localeCompare(a.date) || slotMinutes(a.time) - slotMinutes(b.time));

  const currentTab = TABS.find((t) => t.id === tab)!;

  return (
    <div className="space-y-5">
      <PageSection />

      <OnboardingBanner
        title="This is the live shop board"
        text="Start in Waiting, where new work orders appear. A technician accepts the vehicle, then it moves into In Progress. When work is done and the customer has been updated, the job lands in Completed."
        points={APP_JOURNEY.slice(0, 3).map((x) => x.title)}
      />

      <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <div className="anim-fade-up flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-500">
                <CalendarDays className="size-4" /> {fmtDate(today)}
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Today&apos;s Jobs</h1>
              <p className="mt-1 text-sm text-slate-600">Shop view: every vehicle from check-in to pickup.</p>
            </div>
            <Link
              href="/jobs/new"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-700"
            >
              <Plus className="size-4" /> New Vehicle
            </Link>
          </div>

          <div className="anim-fade-up rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-slate-200">
            <div className="grid grid-cols-3 gap-1">
              {TABS.map((t) => {
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl border-b-[3px] px-1 py-2.5 text-center text-xs font-semibold leading-tight transition sm:px-2 sm:text-sm ${
                      active ? t.active : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <span className="break-words">{t.label}</span>
                    <span className={`min-w-6 rounded-full px-1.5 text-[11px] font-bold leading-5 ${active ? t.count : "bg-slate-100 text-slate-600"}`}>
                      {counts[t.id]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <InfoPanel title={`${currentTab.label} jobs`} text={currentTab.help} tone={tab === "waiting" ? "amber" : tab === "progress" ? "blue" : "emerald"} />

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative w-full md:max-w-sm">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, phone, plate, vehicle…"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setMine((m) => !m)}
                className={`inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition ${mine ? "bg-slate-950 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}
              >
                <UserRound className="size-4" /> My jobs
              </button>
              <div className="flex rounded-full bg-white p-1 ring-1 ring-slate-200">
                {(["today", "all"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setScope(s)}
                    className={`h-8 rounded-full px-3.5 text-xs font-semibold transition ${scope === s ? "bg-slate-950 text-white" : "text-slate-600"}`}
                  >
                    {s === "today" ? "Today" : "All days"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {visible.length === 0 ? (
            <EmptyState
              title={`No ${TABS.find((t) => t.id === tab)?.label.toLowerCase()} jobs`}
              text="Try another tab, clear the search, or check in a new vehicle."
              action={
                <Link href="/jobs/new" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">
                  <Plus className="size-4" /> New Vehicle
                </Link>
              }
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
              {visible.map((job, i) => (
                <JobCard key={job.id} job={job} index={i} />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <InfoPanel
            title="How to use this page"
            text="If you are the front desk, look for Waiting jobs and create new work orders. If you are a technician, turn on My jobs and accept the next vehicle assigned to you."
            tip="Open any card to see the job detail page and move the vehicle forward."
          />
          <Card className="anim-fade-up p-5">
            <h3 className="font-semibold text-slate-950">Quick counts</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between"><dt className="text-slate-500">Waiting right now</dt><dd className="font-bold text-amber-700">{counts.waiting}</dd></div>
              <div className="flex items-center justify-between"><dt className="text-slate-500">Being worked on</dt><dd className="font-bold text-blue-700">{counts.progress}</dd></div>
              <div className="flex items-center justify-between"><dt className="text-slate-500">Finished</dt><dd className="font-bold text-emerald-700">{counts.completed}</dd></div>
              <div className="flex items-center justify-between"><dt className="text-slate-500">Assigned to you</dt><dd className="font-bold text-slate-900">{scoped.filter((j) => j.assignedTo === me.id).length}</dd></div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}

function PageSection() {
  return null;
}

function JobCard({ job, index }: { job: Job; index: number }) {
  const state = useShop();
  const me = useMe();
  const customer = byId(state.customers, job.customerId);
  const vehicle = byId(state.vehicles, job.vehicleId);
  const tech = byId(state.team, job.assignedTo);
  if (!customer || !vehicle) return null;
  const waitingForMe = job.status === "waiting" && job.assignedTo === me.id;

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="anim-fade-up group flex gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200/80 transition hover:-translate-y-0.5 hover:shadow-md sm:p-4"
      style={{ animationDelay: `${Math.min(index, 8) * 0.04}s` }}
    >
      <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-24 sm:w-32">
        <img src={vehiclePhoto(vehicle)} alt={vehicleLabel(vehicle)} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-bold text-slate-950">{vehicleLabel(vehicle)}</p>
            <PlateBadge plate={vehicle.plate} className="mt-1" />
          </div>
          <JobStatusBadge status={job.status} detail />
        </div>
        <p className="mt-1.5 truncate text-sm font-medium text-slate-800">{customer.name}</p>
        <p className="truncate text-sm text-slate-500">{job.complaint}</p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="flex items-center gap-1 text-xs font-medium text-slate-500">
            <Clock className="size-3.5" /> {job.time}
            {job.date !== state.anchorDay && <span>· {fmtDate(job.date, { month: "short", day: "numeric" })}</span>}
          </span>
          {tech ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <Avatar initials={tech.initials} size="sm" tone={tech.id === me.id ? "brand" : "dark"} />
              {tech.name.split(" ")[0]}
              {waitingForMe && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-800">Accept?</span>}
            </span>
          ) : (
            <span className="text-xs font-medium text-slate-400">Unassigned</span>
          )}
        </div>
      </div>
    </Link>
  );
}
