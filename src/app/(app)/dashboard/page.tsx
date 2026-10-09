import Link from "next/link";
import { cookies } from "next/headers";
import {
  AlertTriangle,
  ArrowRight,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  MapPin,
  Plus,
  Search,
} from "lucide-react";
import { Avatar, Card, EmptyState, PageHeader, ProgressBar } from "@/components/ui";
import { SESSION_COOKIE, memberForEmail } from "@/lib/auth";
import { CUSTOMERS, INSPECTIONS, JOBS, MEDIA, PHOTOS, REPORTS, STAGES, TEAM, TODAY, VEHICLES } from "@/lib/data";
import { findCustomer, findVehicle, findMember, formatDate, sectionStatuses, vehicleLabel } from "@/lib/utils";

export default async function DashboardPage() {
  const jar = await cookies();
  const me = memberForEmail(jar.get(SESSION_COOKIE)?.value);
  const firstName = me?.name.split(" ")[0] ?? "there";

  const today = JOBS.filter((j) => j.date === TODAY);
  const inProgress = today.filter((j) => j.stage >= 1 && j.stage <= 3);
  const awaitingApproval = today.filter((j) => j.stage === 2);
  const completed = today.filter((j) => j.stage === 5);
  const unassigned = today.filter((j) => !j.assignedTo);
  const mediaToday = MEDIA.filter((m) => m.takenAt.startsWith(TODAY)).length;

  const readyReports = REPORTS.filter((r) => r.status === "Ready");
  const redInspections = INSPECTIONS.filter((i) => sectionStatuses(i).overall === "red");

  const stats = [
    { label: "Vehicles today", value: today.length, hint: `${unassigned.length} unassigned`, tone: "text-slate-950" },
    { label: "In progress", value: inProgress.length, hint: "Inspection → repair", tone: "text-amber-600" },
    { label: "Awaiting approval", value: awaitingApproval.length, hint: "Estimates sent", tone: "text-sky-600" },
    { label: "Completed", value: completed.length, hint: `${mediaToday} media uploaded`, tone: "text-emerald-600" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={formatDate(TODAY)}
        title={`Welcome back, ${firstName}`}
        subtitle="Here's what's happening on the shop floor today."
        actions={
          <>
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              <Plus className="size-4" /> New job
            </Link>
            <Link
              href="/customers"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:bg-slate-50"
            >
              <Search className="size-4" /> Find customer
            </Link>
          </>
        }
      />

      {/* Hero banner */}
      <div className="anim-fade-up relative overflow-hidden rounded-3xl bg-slate-950 text-white shadow-lg" style={{ animationDelay: "0.1s" }}>
        <img src={PHOTOS.carOnLift} alt="Vehicle on a service lift" className="absolute inset-0 h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
        <div className="relative flex flex-col gap-4 p-6 sm:p-8 md:max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">Today&apos;s shop goal</p>
          <h2 className="text-2xl font-bold leading-tight sm:text-3xl">
            {today.length} vehicles on the schedule. {completed.length} done, {inProgress.length} moving through the bays.
          </h2>
          <div className="max-w-md">
            <div className="mb-2 flex justify-between text-xs text-slate-300">
              <span>Completion</span>
              <span>{Math.round((completed.length / Math.max(today.length, 1)) * 100)}%</span>
            </div>
            <ProgressBar value={(completed.length / Math.max(today.length, 1)) * 100} className="bg-white/10" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {stats.map((s, i) => (
          <Card key={s.label} className="anim-fade-up p-4 sm:p-5" >
            <div style={{ animationDelay: `${0.15 + i * 0.08}s` }}>
              <p className="text-xs font-medium text-slate-500">{s.label}</p>
              <p className={`mt-2 text-3xl font-bold tracking-tight ${s.tone}`}>{s.value}</p>
              <p className="mt-1 text-xs text-slate-500">{s.hint}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Schedule */}
        <Card className="anim-fade-up xl:col-span-2" >
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h3 className="font-semibold text-slate-950">Today&apos;s schedule</h3>
              <p className="text-xs text-slate-500">{today.length} appointments · tap a job to open it</p>
            </div>
            <Link href="/jobs" className="inline-flex items-center gap-1 text-sm font-medium text-amber-700 hover:text-amber-800">
              Job board <ArrowRight className="size-4" />
            </Link>
          </div>

          {today.length === 0 ? (
            <div className="p-5">
              <EmptyState title="No vehicles scheduled" text="New appointments will show up here." />
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {today.map((job, i) => {
                const customer = job.adHoc?.customer ?? findCustomer(job.customerId);
                const vehicle = job.adHoc?.vehicle ?? findVehicle(job.vehicleId);
                const tech = findMember(job.assignedTo);
                const seeded = JOBS.some((j) => j.id === job.id);
                const row = (
                  <div className="grid grid-cols-[auto_1fr] gap-4 px-5 py-4 transition hover:bg-slate-50/80 sm:grid-cols-[88px_1fr_auto]">
                    <div className="flex flex-col">
                      <span className="flex items-center gap-1 text-sm font-semibold text-slate-900">
                        <Clock className="size-3.5 text-slate-400" />
                        {job.time}
                      </span>
                      <span className="mt-1 text-[11px] text-slate-400">{job.id}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">
                        {customer?.name} <span className="font-normal text-slate-500">· {vehicle ? vehicleLabel(vehicle) : ""}</span>
                      </p>
                      <p className="mt-0.5 truncate text-sm text-slate-600">{job.service}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-slate-700">{vehicle?.plate}</span>
                        <span className="flex items-center gap-1">
                          <span className="size-1.5 rounded-full bg-amber-400" />
                          {STAGES[job.stage]}
                        </span>
                        {!job.assignedTo && <span className="font-medium text-rose-600">Unassigned</span>}
                        {job.assignedTo && !job.accepted && <span className="font-medium text-amber-700">Awaiting accept</span>}
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center justify-between gap-3 sm:col-span-1 sm:justify-end">
                      {tech ? (
                        <span className="flex items-center gap-2 text-xs text-slate-600">
                          <Avatar initials={tech.initials} size="sm" />
                          <span className="hidden lg:inline">{tech.name}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">No tech</span>
                      )}
                      {seeded && <ArrowRight className="size-4 text-slate-300" />}
                    </div>
                  </div>
                );
                return (
                  <li key={job.id} className="anim-fade-up" style={{ animationDelay: `${0.2 + i * 0.05}s` }}>
                    {seeded ? <Link href={`/jobs/${job.id}`} className="block">{row}</Link> : row}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Right column */}
        <div className="space-y-6">
          <Card className="anim-fade-up p-5" >
            <h3 className="font-semibold text-slate-950">Needs attention</h3>
            <ul className="mt-4 space-y-3">
              {readyReports.map((r) => {
                const job = JOBS.find((j) => j.id === r.jobId);
                const customer = findCustomer(job?.customerId ?? "");
                return (
                  <li key={r.id}>
                    <Link href="/reports" className="flex items-start gap-3 rounded-xl bg-sky-50 p-3 ring-1 ring-sky-100 transition hover:bg-sky-100/70">
                      <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-sky-600" />
                      <span className="text-sm">
                        <span className="font-semibold text-slate-900">Report ready to send</span>
                        <span className="block text-slate-600">{customer?.name} · {r.id}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
              {redInspections.map((i) => {
                const job = JOBS.find((j) => j.id === i.jobId);
                const vehicle = findVehicle(job?.vehicleId ?? "");
                return (
                  <li key={i.id}>
                    <Link href={`/inspections/${i.jobId}`} className="flex items-start gap-3 rounded-xl bg-rose-50 p-3 ring-1 ring-rose-100 transition hover:bg-rose-100/70">
                      <AlertTriangle className="mt-0.5 size-5 shrink-0 text-rose-600" />
                      <span className="text-sm">
                        <span className="font-semibold text-slate-900">Safety-critical repairs found</span>
                        <span className="block text-slate-600">{vehicle ? vehicleLabel(vehicle) : ""} · {i.jobId}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
              {unassigned.length > 0 && (
                <li>
                  <Link href="/jobs" className="flex items-start gap-3 rounded-xl bg-amber-50 p-3 ring-1 ring-amber-100 transition hover:bg-amber-100/70">
                    <Clock className="mt-0.5 size-5 shrink-0 text-amber-600" />
                    <span className="text-sm">
                      <span className="font-semibold text-slate-900">{unassigned.length} unassigned jobs</span>
                      <span className="block text-slate-600">Claim one from the job board</span>
                    </span>
                  </Link>
                </li>
              )}
            </ul>
          </Card>

          <Card className="anim-fade-up p-5" >
            <h3 className="font-semibold text-slate-950">Team on shift</h3>
            <ul className="mt-4 space-y-3">
              {TEAM.map((m) => {
                const count = today.filter((j) => j.assignedTo === m.id).length;
                return (
                  <li key={m.id} className="flex items-center gap-3">
                    <Avatar initials={m.initials} tone="amber" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{m.name}</p>
                      <p className="truncate text-xs text-slate-500">{m.role}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {count} job{count === 1 ? "" : "s"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card className="anim-fade-up p-5" >
            <h3 className="font-semibold text-slate-950">Quick actions</h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                { href: "/inspections", label: "Start inspection", icon: ClipboardCheck },
                { href: "/media", label: "Upload photo", icon: Camera },
                { href: "/customers", label: "Find vehicle", icon: MapPin },
                { href: "/reports", label: "Send report", icon: CheckCircle2 },
              ].map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex flex-col items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm font-medium text-slate-800 transition hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-50/60"
                >
                  <span className="grid size-8 place-items-center rounded-lg bg-slate-950 text-amber-300">
                    <Icon className="size-4" />
                  </span>
                  {label}
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <p className="text-center text-xs text-slate-400">
        Demo data · {CUSTOMERS.length} customers · {VEHICLES.length} vehicles · no database connected
      </p>
    </div>
  );
}
