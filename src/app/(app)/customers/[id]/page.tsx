import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Car, ClipboardCheck, FileText, MessageSquare, Phone, Play } from "lucide-react";
import { Avatar, Card, PageHeader, StatusBadge, StatusDot } from "@/components/ui";
import { CATEGORY_LABEL, CUSTOMERS, REPORTS, STAGES, type Recommendation } from "@/lib/data";
import {
  findInspectionByJob,
  formatDate,
  inspectionForJob,
  jobsOfCustomer,
  mediaOfVehicle,
  sectionStatuses,
  smsLink,
  statusMeta,
  telLink,
  vehiclesOf,
  vehicleLabel,
  money,
} from "@/lib/utils";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = CUSTOMERS.find((c) => c.id === id);
  if (!customer) notFound();

  const vehicles = vehiclesOf(customer.id);
  const jobs = jobsOfCustomer(customer.id);
  const firstName = customer.name.split(" ")[0];

  const openRecs: (Recommendation & { jobId: string })[] = jobs.flatMap((j) => {
    const ins = findInspectionByJob(j.id);
    return ins ? ins.recommendations.filter((r) => r.severity !== "green").map((r) => ({ ...r, jobId: j.id })) : [];
  });

  return (
    <div className="space-y-6">
      <Link href="/customers" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft className="size-4" /> All customers
      </Link>

      {/* Customer header */}
      <Card className="anim-fade-up p-5 sm:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Avatar initials={customer.name.split(" ").map((p) => p[0]).slice(0, 2).join("")} tone="amber" size="lg" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950">{customer.name}</h1>
              <p className="text-sm text-slate-500">
                {customer.city} · Customer since {customer.since} · {vehicles.length} vehicle{vehicles.length === 1 ? "" : "s"} · {jobs.length} visit{jobs.length === 1 ? "" : "s"}
              </p>
              <p className="mt-1 text-sm text-slate-700">{customer.phone} · {customer.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <a href={telLink(customer.phone)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700">
              <Phone className="size-4" /> Call
            </a>
            <a href={smsLink(customer.phone, `Hi ${firstName}, this is Castle Tire Shop.`)} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
              <MessageSquare className="size-4" /> Text
            </a>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Vehicles */}
        <div className="space-y-6 lg:col-span-2">
          {vehicles.map((v, vi) => {
            const vJobs = jobs.filter((j) => j.vehicleId === v.id);
            const media = mediaOfVehicle(v.id);
            const cover = media.find((m) => m.type === "photo")?.url;
            return (
              <Card key={v.id} className="anim-fade-up scroll-mt-24 overflow-hidden" >
                <div id={`vehicle-${v.id}`} style={{ animationDelay: `${vi * 0.08}s` }}>
                  <div className="grid md:grid-cols-[260px_1fr]">
                    <div className="relative min-h-44 bg-slate-900">
                      {cover && <img src={cover} alt={vehicleLabel(v)} className="absolute inset-0 h-full w-full object-cover opacity-90" />}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                      <div className="absolute bottom-3 left-3 flex items-center gap-2 text-white">
                        <Car className="size-4 text-amber-300" />
                        <span className="font-semibold">{vehicleLabel(v)}</span>
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm text-slate-500">{v.trim} · {v.color}</p>
                        <span className="rounded bg-slate-950 px-2.5 py-1 font-mono text-sm tracking-wider text-amber-300">{v.plate}</span>
                      </div>
                      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div><dt className="text-xs text-slate-500">Mileage</dt><dd className="font-semibold text-slate-900">{v.mileage.toLocaleString("en-US")} mi</dd></div>
                        <div><dt className="text-xs text-slate-500">Media on file</dt><dd className="font-semibold text-slate-900">{media.length} items</dd></div>
                        <div className="col-span-2"><dt className="text-xs text-slate-500">VIN</dt><dd className="font-mono text-xs text-slate-700">{v.vin}</dd></div>
                      </dl>

                      <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-500">Visit history</h3>
                      {vJobs.length === 0 ? (
                        <p className="mt-2 text-sm text-slate-500">No visits yet.</p>
                      ) : (
                        <ul className="mt-2 divide-y divide-slate-100">
                          {vJobs.map((j) => {
                            const ins = inspectionForJob(j);
                            const s = sectionStatuses(ins);
                            const report = REPORTS.find((r) => r.jobId === j.id);
                            return (
                              <li key={j.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-slate-900">{j.service}</p>
                                  <p className="text-xs text-slate-500">{formatDate(j.date)} · {j.time} · {j.id} · {STAGES[j.stage]}</p>
                                  <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600">
                                    {(["tires", "brakes", "tpms", "suspension", "alignment"] as const).map((k) => (
                                      <span key={k} className="flex items-center gap-1 capitalize"><StatusDot status={s[k]} />{k === "tpms" ? "TPMS" : k}</span>
                                    ))}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <StatusBadge status={s.overall} />
                                  <Link href={`/inspections/${j.id}`} aria-label="Open inspection" className="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-amber-300 hover:bg-amber-50/60">
                                    <ClipboardCheck className="size-4" />
                                  </Link>
                                  {report && (
                                    <Link href={`/r/${report.id}`} target="_blank" aria-label="Open customer report" className="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-amber-300 hover:bg-amber-50/60">
                                      <FileText className="size-4" />
                                    </Link>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* Vehicle media */}
                  <div className="border-t border-slate-100 p-5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Photos & videos</h3>
                      <Link href={`/media?job=${vJobs[0]?.id ?? ""}`} className="text-xs font-semibold text-amber-700 hover:text-amber-800">Open library</Link>
                    </div>
                    {media.length === 0 ? (
                      <p className="mt-2 text-sm text-slate-500">No media yet.</p>
                    ) : (
                      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
                        {media.slice(0, 12).map((m) => (
                          <Link key={m.id} href={`/media?job=${m.jobId}&category=${m.category}`} title={`${CATEGORY_LABEL[m.category]}: ${m.title}`} className="group relative aspect-square overflow-hidden rounded-lg bg-slate-900">
                            <img src={m.type === "video" ? m.poster : m.url} alt={m.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                            {m.type === "video" && (
                              <span className="absolute inset-0 grid place-items-center bg-black/25"><Play className="size-5 fill-white text-white" /></span>
                            )}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="anim-fade-up p-5">
            <h2 className="font-semibold text-slate-950">Open recommendations</h2>
            <p className="text-xs text-slate-500">From inspections on this customer&apos;s vehicles</p>
            {openRecs.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">Nothing open. Great work!</p>
            ) : (
              <ul className="mt-4 space-y-2.5">
                {openRecs.map((r) => (
                  <li key={r.id} className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                    <StatusDot status={r.severity} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900">{r.text}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {statusMeta(r.severity).label} · {r.estimate ? money(r.estimate) : "Monitor"} · {r.jobId}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="anim-fade-up p-5">
            <h2 className="font-semibold text-slate-950">All visits</h2>
            <ul className="mt-4 space-y-3">
              {jobs.map((j) => (
                <li key={j.id}>
                  <Link href={`/jobs/${j.id}`} className="flex items-center justify-between gap-3 text-sm transition hover:text-amber-700">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{j.service}</span>
                      <span className="text-xs text-slate-500">{formatDate(j.date)} · {vehicleLabel(vehicles.find((v) => v.id === j.vehicleId) ?? vehicles[0])}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
