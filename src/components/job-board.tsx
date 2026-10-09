"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowUpRight, CheckCircle2, ClipboardCheck, Clock, Plus, Search, UserCheck, X } from "lucide-react";
import { Avatar, Card, EmptyState, ProgressBar } from "@/components/ui";
import { CUSTOMERS, JOBS, STAGES, TEAM, TODAY, VEHICLES, type Job, type Member } from "@/lib/data";
import { customerForJob, findMember, vehicleForJob, vehicleLabel } from "@/lib/utils";

type Tab = "today" | "mine" | "unassigned" | "progress" | "completed" | "all";

const TABS: { id: Tab; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "mine", label: "My jobs" },
  { id: "unassigned", label: "Unassigned" },
  { id: "progress", label: "In progress" },
  { id: "completed", label: "Completed" },
  { id: "all", label: "All" },
];

const TIMES = [
  "07:30 AM", "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM",
  "11:30 AM", "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM",
  "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM",
];

const SERVICES = [
  "Tire replacement (4)",
  "Tire rotation + inspection",
  "Front brake pads & rotors",
  "Wheel alignment",
  "Tire puncture repair",
  "Seasonal tire swap",
  "TPMS sensor service",
  "Oil change + multi-point inspection",
  "Suspension diagnosis",
];

export function JobBoard({ initialJobs, me }: { initialJobs: Job[]; me: Member }) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [tab, setTab] = useState<Tab>("today");
  const [query, setQuery] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  const counts = useMemo(
    () => ({
      today: jobs.filter((j) => j.date === TODAY).length,
      mine: jobs.filter((j) => j.assignedTo === me.id && j.stage < 5).length,
      unassigned: jobs.filter((j) => !j.assignedTo && j.stage < 5).length,
      progress: jobs.filter((j) => j.stage >= 1 && j.stage <= 4).length,
      completed: jobs.filter((j) => j.stage === 5).length,
      all: jobs.length,
    }),
    [jobs, me.id],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const qDigits = query.replace(/\D/g, "");
    return jobs
      .filter((j) => {
        switch (tab) {
          case "today": return j.date === TODAY;
          case "mine": return j.assignedTo === me.id && j.stage < 5;
          case "unassigned": return !j.assignedTo && j.stage < 5;
          case "progress": return j.stage >= 1 && j.stage <= 4;
          case "completed": return j.stage === 5;
          default: return true;
        }
      })
      .filter((j) => {
        if (!q) return true;
        const c = customerForJob(j);
        const v = vehicleForJob(j);
        return (
          c?.name.toLowerCase().includes(q) ||
          v?.plate.toLowerCase().includes(q) ||
          j.service.toLowerCase().includes(q) ||
          j.id.toLowerCase().includes(q) ||
          (qDigits.length >= 3 && c?.phone.replace(/\D/g, "").includes(qDigits))
        );
      })
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  }, [jobs, tab, query, me.id]);

  function update(id: string, patch: Partial<Job>) {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)));
  }

  function createJob(data: {
    name: string; phone: string; email: string; year: number; make: string; model: string;
    plate: string; service: string; time: string; techId: string | null; notes: string;
  }) {
    const n = jobs.length + 1;
    const customerId = `new-c${n}`;
    const vehicleId = `new-v${n}`;
    const job: Job = {
      id: `J-${2060 + n}`,
      date: TODAY,
      time: data.time,
      customerId,
      vehicleId,
      service: data.service,
      stage: 0,
      assignedTo: data.techId,
      accepted: false,
      notes: data.notes,
      adHoc: {
        customer: { id: customerId, name: data.name, phone: data.phone, email: data.email, city: "Massachusetts", since: "2026" },
        vehicle: { id: vehicleId, customerId, year: data.year, make: data.make, model: data.model, trim: "", color: "", plate: data.plate.toUpperCase(), mileage: 0, vin: "Pending" },
      },
    };
    setJobs((prev) => [job, ...prev]);
    setShowNew(false);
    setTab("today");
    setToast(`Job ${job.id} created for ${data.name}. (Demo: saved for this session only.)`);
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="anim-fade-up flex flex-col gap-3 md:flex-row md:items-center md:justify-between" style={{ animationDelay: "0.05s" }}>
        <div className="relative w-full md:max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customer, plate, service…"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/15"
          />
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800"
        >
          <Plus className="size-4" /> New job
        </button>
      </div>

      {/* Tabs */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                active ? "bg-slate-950 text-white shadow" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:text-slate-900"
              }`}
            >
              {t.label}
              <span className={`rounded-full px-1.5 text-[11px] ${active ? "bg-white/15" : "bg-slate-100 text-slate-500"}`}>
                {counts[t.id]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Job grid */}
      {visible.length === 0 ? (
        <EmptyState title="No jobs in this view" text="Try another tab or clear your search." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {visible.map((job, i) => (
            <JobCard
              key={job.id}
              job={job}
              me={me}
              delay={i * 0.04}
              onClaim={() => {
                update(job.id, { assignedTo: me.id, accepted: true });
                setToast(`${job.id} claimed by you.`);
              }}
              onAccept={() => {
                update(job.id, { accepted: true });
                setToast(`${job.id} accepted.`);
              }}
              onAdvance={() => {
                const next = Math.min(job.stage + 1, STAGES.length - 1);
                update(job.id, { stage: next });
                setToast(`${job.id} moved to ${STAGES[next]}.`);
              }}
            />
          ))}
        </div>
      )}

      {showNew && <NewJobModal onClose={() => setShowNew(false)} onCreate={createJob} />}

      {toast && (
        <div className="anim-fade-up fixed bottom-24 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm text-white shadow-2xl md:bottom-8">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}

function JobCard({
  job,
  me,
  delay,
  onClaim,
  onAccept,
  onAdvance,
}: {
  job: Job;
  me: Member;
  delay: number;
  onClaim: () => void;
  onAccept: () => void;
  onAdvance: () => void;
}) {
  const customer = customerForJob(job);
  const vehicle = vehicleForJob(job);
  const tech = findMember(job.assignedTo);
  const isMine = job.assignedTo === me.id;
  const done = job.stage === STAGES.length - 1;
  const seeded = JOBS.some((j) => j.id === job.id);
  const pct = (job.stage / (STAGES.length - 1)) * 100;
  const nextStage = STAGES[Math.min(job.stage + 1, STAGES.length - 1)];

  return (
    <Card className="anim-fade-up flex flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-md" >
      <div style={{ animationDelay: `${delay}s` }} className="flex h-full flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 font-semibold text-slate-800">
              <Clock className="size-3.5" /> {job.time}
            </span>
            <span className="font-mono">{job.id}</span>
            {job.date !== TODAY && <span>· {job.date}</span>}
          </div>
          {done ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
              <CheckCircle2 className="size-3.5" /> Completed
            </span>
          ) : (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-600/20">
              {STAGES[job.stage]}
            </span>
          )}
        </div>

        <div className="mt-4 min-w-0">
          <h3 className="truncate text-lg font-semibold text-slate-950">{customer?.name}</h3>
          <p className="truncate text-sm text-slate-600">
            {vehicle ? vehicleLabel(vehicle) : ""}
            {vehicle?.color ? ` · ${vehicle.color}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-slate-950 px-2 py-0.5 font-mono text-xs tracking-wider text-amber-300">
              {vehicle?.plate}
            </span>
            <span className="text-xs text-slate-500">{customer?.phone}</span>
          </div>
        </div>

        <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-700 ring-1 ring-slate-100">{job.service}</p>

        <div className="mt-4">
          <div className="mb-1.5 flex justify-between text-xs">
            <span className="text-slate-500">Progress</span>
            <span className="font-medium text-slate-700">{Math.round(pct)}%</span>
          </div>
          <ProgressBar value={pct} />
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          {tech ? (
            <div className="flex min-w-0 items-center gap-2">
              <Avatar initials={tech.initials} size="sm" tone={isMine ? "amber" : "slate"} />
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-800">{isMine ? "You" : tech.name}</p>
                {!job.accepted ? (
                  <p className="text-[11px] font-medium text-amber-700">Awaiting acceptance</p>
                ) : (
                  <p className="text-[11px] text-slate-500">Accepted</p>
                )}
              </div>
            </div>
          ) : (
            <span className="rounded-full border border-dashed border-rose-300 px-2.5 py-1 text-xs font-medium text-rose-600">
              Unassigned
            </span>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          {!job.assignedTo && !done && (
            <button onClick={onClaim} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-950 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.98]">
              <UserCheck className="size-4" /> Claim job
            </button>
          )}
          {isMine && !job.accepted && !done && (
            <button onClick={onAccept} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-2.5 text-sm font-semibold text-slate-950 shadow-sm transition hover:brightness-105 active:scale-[0.98]">
              <CheckCircle2 className="size-4" /> Accept job
            </button>
          )}
          {isMine && job.accepted && !done && (
            <button onClick={onAdvance} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 active:scale-[0.98]">
              Move to: {nextStage}
            </button>
          )}
          {seeded && (
            <>
              <Link href={`/inspections/${job.id}`} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:border-amber-300 hover:bg-amber-50/60">
                <ClipboardCheck className="size-4" /> Inspection
              </Link>
              <Link href={`/jobs/${job.id}`} className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2.5 text-slate-700 transition hover:border-amber-300 hover:bg-amber-50/60" aria-label="Open job">
                <ArrowUpRight className="size-4" />
              </Link>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

function NewJobModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (d: {
    name: string; phone: string; email: string; year: number; make: string; model: string;
    plate: string; service: string; time: string; techId: string | null; notes: string;
  }) => void;
}) {
  const [error, setError] = useState<string | null>(null);

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const get = (k: string) => String(fd.get(k) ?? "").trim();
    if (!get("name") || !get("phone") || !get("plate") || !get("service") || !get("make") || !get("model")) {
      setError("Fill in customer name, phone, vehicle, plate and service.");
      return;
    }
    onCreate({
      name: get("name"),
      phone: get("phone"),
      email: get("email"),
      year: Number(get("year")) || new Date().getFullYear(),
      make: get("make"),
      model: get("model"),
      plate: get("plate"),
      service: get("service"),
      time: get("time"),
      techId: get("tech") || null,
      notes: get("notes"),
    });
  }

  const field = "mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/15";
  const label = "text-xs font-semibold uppercase tracking-wide text-slate-500";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <div
        className="anim-fade-up max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:max-w-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Create new job"
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Create new job</h2>
            <p className="text-sm text-slate-500">Customer, vehicle and service for today&apos;s schedule.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="grid size-9 place-items-center rounded-full text-slate-500 hover:bg-slate-100">
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <p className="text-sm font-semibold text-slate-900">Customer</p>
          </div>
          <label className={label}>Full name *<input name="name" className={field} placeholder="Jane Doe" /></label>
          <label className={label}>Mobile phone *<input name="phone" type="tel" className={field} placeholder="(508) 555-0100" /></label>
          <label className={`${label} sm:col-span-2`}>Email<input name="email" type="email" className={field} placeholder="name@email.com" /></label>

          <div className="sm:col-span-2 pt-2">
            <p className="text-sm font-semibold text-slate-900">Vehicle</p>
          </div>
          <label className={label}>Year<input name="year" type="number" min={1980} max={2030} className={field} placeholder="2020" /></label>
          <label className={label}>Make *<input name="make" className={field} placeholder="Honda" /></label>
          <label className={label}>Model *<input name="model" className={field} placeholder="Accord" /></label>
          <label className={label}>License plate *<input name="plate" className={`${field} uppercase`} placeholder="1ABC23" /></label>

          <div className="sm:col-span-2 pt-2">
            <p className="text-sm font-semibold text-slate-900">Service</p>
          </div>
          <label className={`${label} sm:col-span-2`}>
            Requested service *
            <input name="service" list="services" className={field} placeholder="Choose or type a service" />
            <datalist id="services">{SERVICES.map((s) => <option key={s} value={s} />)}</datalist>
          </label>
          <label className={label}>
            Appointment time
            <select name="time" defaultValue="11:30 AM" className={field}>
              {TIMES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>
          <label className={label}>
            Assign technician
            <select name="tech" defaultValue="" className={field}>
              <option value="">Unassigned (claim later)</option>
              {TEAM.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </label>
          <label className={`${label} sm:col-span-2`}>Notes<textarea name="notes" rows={3} className={`${field} h-auto py-2.5`} placeholder="Customer concerns, noises, warnings lights…" /></label>

          {error && <p className="anim-shake sm:col-span-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">{error}</p>}

          <div className="sm:col-span-2 mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="h-11 rounded-xl px-5 text-sm font-medium text-slate-600 hover:bg-slate-100">Cancel</button>
            <button type="submit" className="h-11 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 text-sm font-semibold text-slate-950 shadow-sm transition hover:brightness-105">
              Create job
            </button>
          </div>
        </form>
        <p className="mt-4 text-center text-[11px] text-slate-400">
          Demo: {CUSTOMERS.length} customers and {VEHICLES.length} vehicles are preloaded; new jobs are saved for this session.
        </p>
      </div>
    </div>
  );
}
