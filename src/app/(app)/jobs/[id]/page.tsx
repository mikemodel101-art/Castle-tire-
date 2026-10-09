import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft, Camera, ClipboardCheck, ExternalLink, FileText, MessageSquare, Phone, Play } from "lucide-react";
import { Avatar, Card, PageHeader, StageTracker, StatusBadge } from "@/components/ui";
import { JOBS, PHOTOS, REPORTS, STAGES } from "@/lib/data";
import {
  customerForJob,
  findJob,
  findMember,
  formatDate,
  inspectionForJob,
  jobsOfCustomer,
  mediaOfJob,
  sectionStatuses,
  smsLink,
  telLink,
  vehicleForJob,
  vehicleLabel,
} from "@/lib/utils";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = findJob(id);
  if (!job || !JOBS.some((j) => j.id === id)) notFound();

  const customer = customerForJob(job);
  const vehicle = vehicleForJob(job);
  const tech = findMember(job.assignedTo);
  const media = mediaOfJob(job.id);
  const inspection = inspectionForJob(job);
  const overall = sectionStatuses(inspection).overall;
  const report = REPORTS.find((r) => r.jobId === job.id);
  const history = customer ? jobsOfCustomer(customer.id).filter((j) => j.id !== job.id) : [];
  const nextStage = STAGES[Math.min(job.stage + 1, STAGES.length - 1)];

  return (
    <div className="space-y-6">
      <Link href="/jobs" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft className="size-4" /> Back to job board
      </Link>

      <PageHeader
        eyebrow={`${job.id} · ${formatDate(job.date)} · ${job.time}`}
        title={job.service}
        subtitle={`${customer?.name ?? ""} · ${vehicle ? vehicleLabel(vehicle) : ""}`}
        actions={
          <>
            <Link href={`/inspections/${job.id}`} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800">
              <ClipboardCheck className="size-4" /> Open inspection
            </Link>
            <Link href={`/media?job=${job.id}`} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:bg-slate-50">
              <Camera className="size-4" /> Add photos
            </Link>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Progress */}
          <Card className="anim-fade-up p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-semibold text-slate-950">Job progress</h2>
              <span className="text-xs text-slate-500">Next: {job.stage < 5 ? nextStage : "—"}</span>
            </div>
            <div className="mt-5">
              <StageTracker stage={job.stage} />
            </div>
          </Card>

          {/* Customer & vehicle */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="anim-fade-up p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Customer</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-950">{customer?.name}</h3>
              <dl className="mt-4 space-y-2.5 text-sm">
                <Row label="Phone" value={customer?.phone ?? "—"} />
                <Row label="Email" value={customer?.email ?? "—"} />
                <Row label="City" value={customer?.city ?? "—"} />
                <Row label="Customer since" value={customer?.since ?? "—"} />
              </dl>
              <div className="mt-5 grid grid-cols-2 gap-2">
                {customer && (
                  <>
                    <a href={telLink(customer.phone)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700">
                      <Phone className="size-4" /> Call
                    </a>
                    <a href={smsLink(customer.phone, `Hi ${customer.name.split(" ")[0]}, this is Castle Tire Shop about your ${vehicle ? vehicleLabel(vehicle) : "vehicle"}.`)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
                      <MessageSquare className="size-4" /> Text
                    </a>
                  </>
                )}
              </div>
            </Card>

            <Card className="anim-fade-up overflow-hidden">
              {vehicle && (
                <img src={media.find((m) => m.type === "photo")?.url ?? PHOTOS.carOnLift} alt="" className="h-36 w-full object-cover" />
              )}
              <div className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vehicle</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-950">{vehicle ? vehicleLabel(vehicle) : "—"}</h3>
                <p className="text-sm text-slate-500">{vehicle?.trim} · {vehicle?.color}</p>
                <dl className="mt-4 space-y-2.5 text-sm">
                  <Row label="Plate (MA)" value={<span className="rounded bg-slate-950 px-2 py-0.5 font-mono text-amber-300">{vehicle?.plate}</span>} />
                  <Row label="Mileage" value={vehicle ? `${vehicle.mileage.toLocaleString("en-US")} mi` : "—"} />
                  <Row label="VIN" value={<span className="font-mono text-xs">{vehicle?.vin}</span>} />
                </dl>
              </div>
            </Card>
          </div>

          {/* Notes */}
          <Card className="anim-fade-up p-5">
            <h2 className="font-semibold text-slate-950">Notes & concerns</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">{job.notes || "No notes added yet."}</p>
          </Card>

          {/* Media */}
          <Card className="anim-fade-up p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-950">Photos & videos ({media.length})</h2>
              <Link href={`/media?job=${job.id}`} className="text-sm font-medium text-amber-700 hover:text-amber-800">View all</Link>
            </div>
            {media.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">No media yet. Upload from your phone with Add photos.</p>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {media.slice(0, 8).map((m) => (
                  <Link key={m.id} href={`/media?job=${job.id}`} className="group relative aspect-square overflow-hidden rounded-xl bg-slate-900">
                    <img src={m.type === "video" ? m.poster : m.url} alt={m.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    {m.type === "video" && (
                      <span className="absolute inset-0 grid place-items-center bg-black/20">
                        <span className="grid size-10 place-items-center rounded-full bg-white/90 text-slate-900"><Play className="size-4 fill-current" /></span>
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="anim-fade-up p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Assigned technician</p>
            {tech ? (
              <div className="mt-3 flex items-center gap-3">
                <Avatar initials={tech.initials} tone="amber" size="lg" />
                <div>
                  <p className="font-semibold text-slate-900">{tech.name}</p>
                  <p className="text-sm text-slate-500">{tech.role}</p>
                  <p className="mt-1 text-xs">{job.accepted ? <span className="text-emerald-700">Accepted</span> : <span className="text-amber-700">Awaiting acceptance</span>}</p>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-rose-600">Unassigned. Claim from the job board.</p>
            )}
          </Card>

          <Card className="anim-fade-up p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Inspection</p>
              <StatusBadge status={overall} />
            </div>
            <p className="mt-3 text-sm text-slate-600">
              {inspection.recommendations.length} recommendation{inspection.recommendations.length === 1 ? "" : "s"} on file.
            </p>
            <Link href={`/inspections/${job.id}`} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-amber-300 hover:bg-amber-50/60">
              <ClipboardCheck className="size-4" /> Open inspection form
            </Link>
          </Card>

          <Card className="anim-fade-up p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Customer report</p>
            {report ? (
              <div className="mt-3 space-y-3">
                <p className="text-sm text-slate-700">
                  <span className="font-mono text-xs">{report.id}</span> · {report.status}
                </p>
                <div className="grid gap-2">
                  <Link href={`/r/${report.id}`} target="_blank" className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
                    <ExternalLink className="size-4" /> Preview report
                  </Link>
                  <Link href="/reports" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                    <FileText className="size-4" /> Send by text
                  </Link>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">Report is created after the inspection is complete.</p>
            )}
          </Card>

          <Card className="anim-fade-up p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Previous visits</p>
            {history.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No earlier visits in this demo.</p>
            ) : (
              <ul className="mt-3 divide-y divide-slate-100">
                {history.map((h) => (
                  <li key={h.id}>
                    <Link href={`/jobs/${h.id}`} className="flex items-center justify-between py-2.5 text-sm transition hover:text-amber-700">
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{h.service}</span>
                        <span className="text-xs text-slate-500">{formatDate(h.date)} · {h.id}</span>
                      </span>
                      <span className="text-xs text-slate-400">{STAGES[h.stage]}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2.5 last:border-0 last:pb-0">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-900">{value}</dd>
    </div>
  );
}
