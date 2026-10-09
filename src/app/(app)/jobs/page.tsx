"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowUpDown,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock,
  Flame,
  LayoutGrid,
  List,
  Plus,
  Receipt,
  Search,
  UserRound,
} from "lucide-react";
import { Avatar, EmptyState, JobStatusBadge, PlateBadge } from "@/components/ui";
import { HelpTip } from "@/components/onboarding";
import type { Job } from "@/lib/data";
import { useMe, useShop } from "@/lib/store";
import { jobPriority, jobWaitLabel, sortJobs } from "@/lib/insights";
import {
  byId,
  digits,
  fmtDate,
  inspectionProgress,
  jobGroup,
  vehicleLabel,
  vehiclePhoto,
  type JobGroup,
} from "@/lib/utils";

const TABS: { id: JobGroup; label: string; short: string; hint: string; active: string; activeBg: string; count: string }[] = [
  { id: "waiting", label: "Waiting", short: "Waiting", hint: "Needs a tech", active: "border-amber-500 text-slate-950", activeBg: "bg-amber-50", count: "bg-amber-400 text-slate-950" },
  { id: "progress", label: "In Progress", short: "Active", hint: "Being worked", active: "border-blue-600 text-slate-950", activeBg: "bg-blue-50", count: "bg-blue-600 text-white" },
  { id: "completed", label: "Completed", short: "Done", hint: "Ready / picked up", active: "border-emerald-600 text-slate-950", activeBg: "bg-emerald-50", count: "bg-emerald-600 text-white" },
];

type ViewMode = "cards" | "timeline";

export default function TodaysJobsPage() {
  const state = useShop();
  const me = useMe();
  const [tab, setTab] = useState<JobGroup>("waiting");
  const [scope, setScope] = useState<"today" | "all">("today");
  const [mine, setMine] = useState(false);
  const [query, setQuery] = useState("");
  const [techFilter, setTechFilter] = useState<string>("all");
  const [sort, setSort] = useState<"time" | "status" | "tech">("time");
  const [view, setView] = useState<ViewMode>("cards");
  const [urgentOnly, setUrgentOnly] = useState(false);
  const today = state.anchorDay;

  const scoped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const qd = digits(query);
    return state.jobs
      .filter((j) => (scope === "today" ? j.date === today : true))
      .filter((j) => (mine ? j.assignedTo === me.id : true))
      .filter((j) => (techFilter === "all" ? true : techFilter === "unassigned" ? !j.assignedTo : j.assignedTo === techFilter))
      .filter((j) => (urgentOnly ? jobPriority(state, j.id) === "urgent" : true))
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
  }, [state, scope, mine, query, today, me.id, techFilter, urgentOnly]);

  const counts: Record<JobGroup, number> = {
    waiting: scoped.filter((j) => jobGroup(j.status) === "waiting").length,
    progress: scoped.filter((j) => jobGroup(j.status) === "progress").length,
    completed: scoped.filter((j) => jobGroup(j.status) === "completed").length,
  };

  const visible = sortJobs(
    scoped.filter((j) => jobGroup(j.status) === tab),
    sort,
  ).sort((a, b) => (scope === "all" ? b.date.localeCompare(a.date) : 0));

  const urgentCount = scoped.filter((j) => jobPriority(state, j.id) === "urgent").length;

  return (
    <div className="space-y-5">
      <div className="anim-fade-up flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-500">
            <CalendarDays className="size-4" /> {fmtDate(today)}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Today&apos;s Jobs
            <HelpTip title="The shop board">
              Every car, left to right through the day: Waiting → In Progress → Completed. Newcomers: open a Waiting card and tap Accept Job.
            </HelpTip>
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Shop view: every vehicle from check-in to pickup. {urgentCount > 0 && <span className="font-bold text-red-600">· {urgentCount} urgent (red findings)</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-xl bg-white p-1 ring-1 ring-slate-200">
            <button type="button" onClick={() => setView("cards")} aria-label="Card view" className={`grid size-9 place-items-center rounded-lg ${view === "cards" ? "bg-slate-950 text-white" : "text-slate-500"}`}>
              <LayoutGrid className="size-4" />
            </button>
            <button type="button" onClick={() => setView("timeline")} aria-label="Timeline view" className={`grid size-9 place-items-center rounded-lg ${view === "timeline" ? "bg-slate-950 text-white" : "text-slate-500"}`}>
              <List className="size-4" />
            </button>
          </div>
          <Link href="/jobs/new" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-700">
            <Plus className="size-4" /> New Vehicle
          </Link>
        </div>
      </div>

      <div className="anim-fade-up rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-slate-200">
        <div role="tablist" aria-label="Filter jobs by status" className="grid grid-cols-3 gap-1">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl border-b-[3px] px-1 py-2.5 transition sm:flex-row sm:gap-2 sm:px-3 sm:py-3 ${
                  active ? `${t.active} ${t.activeBg}` : "border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <span className="min-w-0 truncate text-xs font-bold sm:text-sm">
                  <span className="sm:hidden">{t.short}</span>
                  <span className="hidden sm:inline">{t.label}</span>
                </span>
                <span
                  className={`shrink-0 rounded-full px-1.5 text-[11px] font-black leading-5 sm:text-xs ${active ? t.count : "bg-slate-100 text-slate-600"}`}
                >
                  {counts[t.id]}
                </span>
                <span className={`hidden truncate text-[11px] font-medium lg:inline ${active ? "text-slate-600" : "text-slate-400"}`}>
                  {t.hint}
                </span>
              </button>
            );
          })}
        </div>
        <p className="border-t border-slate-100 px-3 py-2 text-center text-[11px] font-medium text-slate-400 sm:text-xs">
          {counts[tab]} vehicle{counts[tab] === 1 ? "" : "s"} · {tab === "waiting" ? "tap a card, then Accept Job" : tab === "progress" ? "inspection → report → approval" : "finished today"}
        </p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, phone, plate, vehicle…"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setMine((m) => !m)} className={`inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition ${mine ? "bg-slate-950 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}>
            <UserRound className="size-4" /> My jobs
          </button>
          <button type="button" onClick={() => setUrgentOnly((v) => !v)} className={`inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition ${urgentOnly ? "bg-red-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}>
            <Flame className="size-4" /> Urgent{urgentCount ? ` (${urgentCount})` : ""}
          </button>
          <select value={techFilter} onChange={(e) => setTechFilter(e.target.value)} aria-label="Filter by technician" className="h-10 rounded-full border-0 bg-white px-4 text-sm font-semibold text-slate-600 ring-1 ring-slate-200">
            <option value="all">All techs</option>
            <option value="unassigned">Unassigned</option>
            {state.team.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <button type="button" onClick={() => setSort(sort === "time" ? "status" : sort === "status" ? "tech" : "time")} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-sm font-semibold text-slate-600 ring-1 ring-slate-200">
            <ArrowUpDown className="size-4" /> Sort: {sort}
          </button>
          <div className="flex rounded-full bg-white p-1 ring-1 ring-slate-200">
            {(["today", "all"] as const).map((s) => (
              <button key={s} type="button" onClick={() => setScope(s)} className={`h-8 rounded-full px-3.5 text-xs font-semibold transition ${scope === s ? "bg-slate-950 text-white" : "text-slate-600"}`}>
                {s === "today" ? "Today" : "All days"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title={`No ${TABS.find((t) => t.id === tab)?.label.toLowerCase()} jobs`}
          text={urgentOnly ? "No red-finding jobs in this view. Nice — turn off Urgent to see everything." : "Try another tab, clear the search, or check in a new vehicle."}
          action={
            <Link href="/jobs/new" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">
              <Plus className="size-4" /> New Vehicle
            </Link>
          }
        />
      ) : view === "cards" ? (
        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {visible.map((job, i) => (
            <JobCard key={job.id} job={job} index={i} />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <ul className="divide-y divide-slate-100">
            {visible.map((job) => (
              <TimelineRow key={job.id} job={job} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function useJobExtras(job: Job) {
  const state = useShop();
  const ins = state.inspections.find((i) => i.jobId === job.id);
  const pct = inspectionProgress(ins, state.settings);
  const media = state.media.filter((m) => m.jobId === job.id).length;
  const est = state.estimates.find((e) => e.jobId === job.id);
  const rep = state.reports.find((r) => r.jobId === job.id);
  const priority = jobPriority(state, job.id);
  const wait = jobWaitLabel(job, state.anchorDay);
  return { ins, pct, media, est, rep, priority, wait };
}

function JobCard({ job, index }: { job: Job; index: number }) {
  const state = useShop();
  const me = useMe();
  const customer = byId(state.customers, job.customerId);
  const vehicle = byId(state.vehicles, job.vehicleId);
  const tech = byId(state.team, job.assignedTo);
  const { pct, media, est, rep, priority, wait } = useJobExtras(job);
  if (!customer || !vehicle) return null;
  const waitingForMe = job.status === "waiting" && job.assignedTo === me.id;

  return (
    <Link
      href={`/jobs/${job.id}`}
      className={`anim-fade-up group relative flex gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 transition hover:-translate-y-0.5 hover:shadow-md sm:p-4 ${priority === "urgent" ? "ring-2 ring-red-500" : priority === "soon" ? "ring-amber-300" : "ring-slate-200/80"}`}
      style={{ animationDelay: `${Math.min(index, 8) * 0.04}s` }}
    >
      {priority === "urgent" && (
        <span className="absolute -top-2.5 left-3 flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-white shadow">
          <Flame className="size-3" /> Urgent
        </span>
      )}
      <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-24 sm:w-32">
        <img src={vehiclePhoto(vehicle)} alt={vehicleLabel(vehicle)} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        {media > 0 && (
          <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur">
            <Camera className="size-3" /> {media}
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-950 sm:text-base">{vehicleLabel(vehicle)}</p>
            <PlateBadge plate={vehicle.plate} className="mt-1" />
          </div>
          <span className="shrink-0">
            <JobStatusBadge status={job.status} detail />
          </span>
        </div>
        <p className="mt-1.5 truncate text-sm font-medium text-slate-800">{customer.name}</p>
        <p className="truncate text-sm text-slate-500">{job.complaint}</p>
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-blue-600" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[10px] font-bold text-slate-500">{pct}%</span>
          {est && (
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${est.status === "approved" ? "bg-emerald-100 text-emerald-700" : est.status === "sent" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
              <Receipt className="mr-0.5 inline size-3" />{est.status}
            </span>
          )}
          {rep?.sentAt && <CheckCircle2 className="size-3.5 text-emerald-500" />}
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-1 pt-2">
          <span className="flex min-w-0 items-center gap-1 truncate text-xs font-medium text-slate-500">
            <Clock className="size-3.5 shrink-0" />
            <span className="shrink-0">{job.time}</span>
            {wait && <span className="hidden truncate text-slate-400 min-[400px]:inline">· {wait}</span>}
          </span>
          {tech ? (
            <span className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-slate-700">
              <Avatar initials={tech.initials} size="sm" tone={tech.id === me.id ? "brand" : "dark"} />
              <span className="max-w-16 truncate sm:max-w-none">{tech.name.split(" ")[0]}</span>
              {waitingForMe && <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-800">Accept?</span>}
            </span>
          ) : (
            <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700 ring-1 ring-amber-200">Unassigned</span>
          )}
        </div>
      </div>
    </Link>
  );
}

function TimelineRow({ job }: { job: Job }) {
  const state = useShop();
  const customer = byId(state.customers, job.customerId);
  const vehicle = byId(state.vehicles, job.vehicleId);
  const tech = byId(state.team, job.assignedTo);
  const { pct, media, est, priority, wait } = useJobExtras(job);
  if (!customer || !vehicle) return null;
  return (
    <li>
      <Link href={`/jobs/${job.id}`} className="grid gap-2 px-4 py-3 transition hover:bg-slate-50 sm:grid-cols-[90px_1fr_auto] sm:items-center sm:gap-4 sm:px-5">
        <span className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
          <Clock className="size-4 text-slate-400" /> {job.time}
        </span>
        <span className="flex min-w-0 items-center gap-3">
          <img src={vehiclePhoto(vehicle)} alt="" className="hidden h-10 w-14 shrink-0 rounded-lg object-cover sm:block" />
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className="truncate font-semibold text-slate-900">{vehicleLabel(vehicle)} · {customer.name}</span>
              {priority === "urgent" && <span className="rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-black text-white">URGENT</span>}
              {priority === "soon" && <span className="rounded bg-amber-400 px-1.5 py-0.5 text-[10px] font-black text-slate-950">SOON</span>}
            </span>
            <span className="block truncate text-xs text-slate-500">
              {job.complaint} · {wait ?? ""} · {pct}% inspected · {media} media{est ? ` · est. ${est.status}` : ""}
            </span>
          </span>
        </span>
        <span className="flex items-center justify-between gap-3 sm:justify-end">
          <span className="text-xs font-semibold text-slate-500">{tech?.name.split(" ")[0] ?? "Unassigned"}</span>
          <JobStatusBadge status={job.status} />
        </span>
      </Link>
    </li>
  );
}
