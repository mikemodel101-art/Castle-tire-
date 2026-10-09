"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  Camera,
  Check,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  FileText,
  MessageSquare,
  Phone,
  Play,
  Receipt,
  UserCheck,
} from "lucide-react";
import { ShopIcon } from "@/components/brand";
import { Avatar, Card, EmptyState, InfoPanel, JobStatusBadge, LightChip, PlateBadge } from "@/components/ui";
import { Toast, useToast } from "@/components/toast";
import { JOB_STATUSES, JOB_STATUS_LABEL, SUMMARY_ORDER, SECTION_LABEL } from "@/lib/data";
import { APP_JOURNEY } from "@/lib/help";
import { acceptJob, assignJob, setJobStatus, useMe, useShop } from "@/lib/store";
import {
  byId,
  estimateTotals,
  firstName,
  fmtDate,
  fmtMiles,
  fmtTime,
  jobBundle,
  money,
  relDay,
  sectionChip,
  smsHref,
  statusIndex,
  telHref,
  vehicleLabel,
  vehiclePhoto,
} from "@/lib/utils";

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const state = useShop();
  const me = useMe();
  const router = useRouter();
  const [toast, showToast] = useToast();
  const created = useSearchParams().has("created");

  const b = jobBundle(state, id);
  if (!b) {
    return (
      <EmptyState
        title="Job not found"
        text="This work order doesn't exist in the demo data."
        action={<Link href="/jobs" className="font-semibold text-blue-600">Back to Today&apos;s Jobs</Link>}
      />
    );
  }
  const { job, customer, vehicle, tech, inspection, report, estimate, media } = b;
  const s = state.settings;
  const current = statusIndex(job.status);
  const history = state.jobs
    .filter((j) => j.vehicleId === vehicle.id && j.id !== job.id)
    .sort((a, c) => c.date.localeCompare(a.date));

  const meFirst = firstName(me.name);
  let action: ReactNode = null;
  switch (job.status) {
    case "waiting":
      action = (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => {
              acceptJob(job.id, me.id);
              showToast(`${job.id} accepted by ${meFirst}.`);
            }}
            className="anim-shimmer relative flex h-16 w-full flex-col items-center justify-center overflow-hidden rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-700 active:scale-[0.99]"
          >
            <span className="text-lg font-bold">Accept Job</span>
            <span className="text-xs font-medium text-emerald-100">({meFirst})</span>
          </button>
          {tech && tech.id !== me.id && (
            <p className="text-center text-xs text-slate-500">Pre-assigned to {tech.name}. Accepting moves it to you.</p>
          )}
        </div>
      );
      break;
    case "accepted":
      action = (
        <button
          type="button"
          onClick={() => {
            setJobStatus(job.id, "inspection", me.id);
            router.push(`/inspections/${job.id}`);
          }}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-base font-bold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700"
        >
          <ClipboardCheck className="size-5" /> Start Inspection
        </button>
      );
      break;
    case "inspection":
      action = (
        <Link href={`/inspections/${job.id}`} className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-base font-bold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700">
          <ClipboardCheck className="size-5" /> Continue Inspection
        </Link>
      );
      break;
    case "inspection_complete":
      action = (
        <Link href={`/inspections/${job.id}/complete`} className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-base font-bold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700">
          <MessageSquare className="size-5" /> Review &amp; Send to Customer
        </Link>
      );
      break;
    case "customer_contacted":
      action = (
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              setJobStatus(job.id, "approved", me.id);
              showToast("Marked as approved by the customer.");
            }}
            className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-600 font-bold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700"
          >
            <UserCheck className="size-5" /> Customer Approved
          </button>
          <Link href={estimate ? `/estimates/${estimate.id}` : `/inspections/${job.id}/complete`} className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-white font-bold text-slate-800 ring-1 ring-slate-200 transition hover:bg-slate-50">
            <Receipt className="size-5" /> {estimate ? "View Estimate" : "Create Estimate"}
          </Link>
        </div>
      );
      break;
    case "approved":
      action = (
        <button
          type="button"
          onClick={() => {
            setJobStatus(job.id, "completed", me.id);
            showToast(`${job.id} completed. Ready for pickup.`);
          }}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 text-base font-bold text-white shadow-lg transition hover:bg-slate-800"
        >
          <CheckCircle2 className="size-5" /> Mark Job Completed
        </button>
      );
      break;
    case "completed":
      action = (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-800 ring-1 ring-emerald-200">
          <CheckCircle2 className="size-6 shrink-0" />
          <div className="text-sm">
            <p className="font-bold">Job completed</p>
            <p>Finished {fmtTime(job.timeline.find((t) => t.status === "completed")?.at ?? job.date)}. Vehicle ready for pickup.</p>
          </div>
        </div>
      );
      break;
  }

  return (
    <div className="space-y-5">
      <Link href="/jobs" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft className="size-4" /> Today&apos;s Jobs
      </Link>

      {created && (
        <div className="anim-pop flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-800 ring-1 ring-emerald-200">
          <CheckCircle2 className="size-5 shrink-0" />
          <p className="text-sm">
            <span className="font-bold">Work order {job.id} created.</span> It&apos;s now on Today&apos;s Jobs under Waiting.
          </p>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr] xl:grid-cols-1">
            <Card className="anim-fade-up overflow-hidden">
              <div className="relative h-48 bg-slate-900 sm:h-56">
                <img src={vehiclePhoto(vehicle)} alt={vehicleLabel(vehicle)} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                <div className="absolute left-4 top-4">
                  <span className="rounded-full bg-white/90 px-2.5 py-1 font-mono text-xs font-bold text-slate-800 backdrop-blur">{job.id}</span>
                </div>
                <div className="absolute right-4 top-4">
                  <JobStatusBadge status={job.status} />
                </div>
                <div className="absolute inset-x-4 bottom-4 text-white">
                  <h1 className="text-2xl font-bold tracking-tight">{vehicleLabel(vehicle)}</h1>
                  <p className="mt-0.5 text-sm text-slate-200">
                    {vehicle.plate} &nbsp;|&nbsp; {fmtMiles(job.mileageIn || vehicle.mileage)}
                    {vehicle.color ? ` · ${vehicle.color}` : ""}
                  </p>
                </div>
              </div>

              <div className="space-y-5 p-5 sm:p-6">
                <dl className="grid gap-3 text-sm">
                  <div className="grid grid-cols-[96px_1fr] gap-2">
                    <dt className="text-slate-500">Customer:</dt>
                    <dd>
                      <Link href={`/customers/${customer.id}`} className="font-semibold text-slate-900 hover:text-blue-600">{customer.name}</Link>
                      <span className="block text-slate-600">{customer.phone}</span>
                    </dd>
                  </div>
                  <div className="grid grid-cols-[96px_1fr] gap-2">
                    <dt className="text-slate-500">Complaint:</dt>
                    <dd className="font-medium text-slate-900">{job.complaint}</dd>
                  </div>
                  <div className="grid grid-cols-[96px_1fr] gap-2">
                    <dt className="text-slate-500">Appointment:</dt>
                    <dd className="text-slate-900">{relDay(job.date, state.anchorDay)} · {job.time}</dd>
                  </div>
                </dl>

                {action}

                <div>
                  <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Job status</h2>
                  <ol className="relative space-y-0">
                    {JOB_STATUSES.map((st, i) => {
                      const entry = [...job.timeline].reverse().find((t) => t.status === st);
                      const done = i <= current;
                      const isCurrent = i === current;
                      const who = entry ? byId(state.team, entry.by)?.name.split(" ")[0] : undefined;
                      return (
                        <li key={st} className="relative flex gap-3 pb-4 last:pb-0">
                          {i < JOB_STATUSES.length - 1 && (
                            <span className={`absolute left-[11px] top-6 h-[calc(100%-12px)] w-0.5 ${i < current ? "bg-blue-600" : "bg-slate-200"}`} />
                          )}
                          <span
                            className={`relative z-10 grid size-6 shrink-0 place-items-center rounded-full ring-2 ${
                              done ? "bg-blue-600 text-white ring-blue-600" : "bg-white ring-slate-300"
                            } ${isCurrent && job.status !== "completed" ? "anim-ping-ring" : ""}`}
                          >
                            {done && <Check className="size-3.5" strokeWidth={3} />}
                          </span>
                          <div className="min-w-0 pt-0.5">
                            <p className={`text-sm ${done ? "font-semibold text-slate-900" : "text-slate-500"}`}>{JOB_STATUS_LABEL[st]}</p>
                            {entry && (
                              <p className="text-xs text-slate-500">
                                {who ?? "Shop"} · {fmtTime(entry.at)}
                              </p>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </div>
            </Card>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-1">
              <Card className="anim-fade-up p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contact</p>
                <div className="mt-3 flex items-center gap-3">
                  <Avatar initials={customer.name.split(" ").map((p) => p[0]).slice(0, 2).join("")} tone="light" size="lg" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{customer.name}</p>
                    <p className="truncate text-sm text-slate-500">{customer.phone} · {customer.city}</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <a href={telHref(customer.phone)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
                    <Phone className="size-4" /> Call
                  </a>
                  <a href={smsHref(customer.phone, `Hi ${firstName(customer.name)}, this is ${s.shopName} about your ${vehicleLabel(vehicle)}.`)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
                    <MessageSquare className="size-4" /> Text
                  </a>
                </div>
              </Card>

              <Card className="anim-fade-up p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Technician</p>
                  <select
                    value={job.assignedTo ?? ""}
                    onChange={(e) => assignJob(job.id, e.target.value || null)}
                    aria-label="Assign technician"
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
                  >
                    <option value="">Unassigned</option>
                    {state.team.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                {tech ? (
                  <div className="mt-3 flex items-center gap-3">
                    <Avatar initials={tech.initials} tone={tech.id === me.id ? "brand" : "dark"} size="lg" />
                    <div>
                      <p className="font-semibold text-slate-900">{tech.name}{tech.id === me.id ? " (you)" : ""}</p>
                      <p className="text-sm text-slate-500">{tech.role}</p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">Waiting for a technician to accept.</p>
                )}
              </Card>
            </div>
          </div>

          <Card className="anim-fade-up p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Inspection</p>
              {inspection?.completedAt && <span className="text-xs font-semibold text-emerald-700">Complete · {fmtTime(inspection.completedAt)}</span>}
            </div>
            {inspection ? (
              <ul className="mt-3 divide-y divide-slate-100">
                {SUMMARY_ORDER.map((sec) => {
                  const chip = sectionChip(inspection, sec, s);
                  return (
                    <li key={sec} className="flex items-center justify-between py-2">
                      <span className="flex items-center gap-2 text-sm font-medium text-slate-800">
                        <ShopIcon name={sec} className="size-4 text-slate-500" /> {SECTION_LABEL[sec]}
                      </span>
                      <LightChip light={chip.light} label={chip.label} />
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-500">Not started. Accept the job, then start the inspection.</p>
            )}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link href={`/inspections/${job.id}`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50">
                <ClipboardCheck className="size-4" /> {inspection ? "Open" : "Start"}
              </Link>
              <Link href={`/inspections/${job.id}/sheet`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50">
                <FileText className="size-4" /> Sheet
              </Link>
            </div>
          </Card>

          <Card className="anim-fade-up p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Photos &amp; videos ({media.length})</p>
              <Link href={`/media?job=${job.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600">
                <Camera className="size-3.5" /> Add
              </Link>
            </div>
            {media.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No media yet. Use the camera buttons during the inspection.</p>
            ) : (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {media.slice(0, 8).map((m) => (
                  <Link key={m.id} href={`/media?job=${job.id}`} className="group relative aspect-square overflow-hidden rounded-lg bg-slate-900">
                    <img src={m.type === "video" ? m.poster ?? "" : m.url} alt={m.caption} className="h-full w-full object-cover transition group-hover:scale-105" />
                    {m.type === "video" && (
                      <span className="absolute inset-0 grid place-items-center bg-black/25">
                        <Play className="size-4 fill-white text-white" />
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <InfoPanel
            title="What should the user do on this page?"
            text="Use this page as the command center for one vehicle: confirm customer details, assign the right technician, move the status, open the inspection, and then send the report or estimate."
            tip="If the job is still waiting, the next action is usually Accept Job or assigning it to a technician."
          />

          <Card className="anim-fade-up p-5">
            <h3 className="font-semibold text-slate-950">Where am I in the workflow?</h3>
            <ol className="mt-4 space-y-3 text-sm text-slate-600">
              {APP_JOURNEY.slice(1, 6).map((step, i) => (
                <li key={step.title} className="flex items-start gap-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-slate-950 text-xs font-bold text-white">{i + 2}</span>
                  <div>
                    <p className="font-semibold text-slate-900">{step.title}</p>
                    <p>{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          {(report || estimate) && (
            <Card className="anim-fade-up space-y-3 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Customer communication</p>
              {report && (
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span>
                    Report <span className="font-mono text-xs">/r/{report.code}</span>
                    <span className="block text-xs text-slate-500">{report.sentAt ? `Texted ${fmtTime(report.sentAt)}` : "Not sent yet"}</span>
                  </span>
                  <Link href={`/r/${report.code}`} target="_blank" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600">
                    Preview <ExternalLink className="size-3.5" />
                  </Link>
                </div>
              )}
              {estimate && (
                <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-sm">
                  <span>
                    Estimate {estimate.id}
                    <span className="block text-xs capitalize text-slate-500">
                      {estimate.status} · {money(estimateTotals(estimate, s.taxRate).total, true)}
                    </span>
                  </span>
                  <Link href={`/estimates/${estimate.id}`} className="text-xs font-semibold text-blue-600">Open</Link>
                </div>
              )}
            </Card>
          )}

          <Card className="anim-fade-up p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vehicle history</p>
            {history.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">First visit for this vehicle.</p>
            ) : (
              <ul className="mt-2 divide-y divide-slate-100">
                {history.map((h) => (
                  <li key={h.id}>
                    <Link href={`/jobs/${h.id}`} className="flex items-center justify-between gap-3 py-2.5 text-sm hover:text-blue-600">
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{h.complaint}</span>
                        <span className="text-xs text-slate-500">{fmtDate(h.date, { month: "short", day: "numeric", year: "numeric" })} · {h.id}</span>
                      </span>
                      <JobStatusBadge status={h.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <PlateBadge plate={vehicle.plate} className="mt-3" />
          </Card>
        </div>
      </div>
      <Toast toast={toast} />
    </div>
  );
}
