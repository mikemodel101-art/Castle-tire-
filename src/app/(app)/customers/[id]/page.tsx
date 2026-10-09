"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ClipboardCheck, ExternalLink, FileText, MessageSquare, Phone, Play, Plus } from "lucide-react";
import { ShopIcon } from "@/components/brand";
import { Avatar, Card, EmptyState, JobStatusBadge, LightChip, LightDot, PlateBadge } from "@/components/ui";
import { MEDIA_SECTION_LABEL, PRIORITY_LABEL, SECTION_LABEL, SUMMARY_ORDER } from "@/lib/data";
import { useShop } from "@/lib/store";
import { customerStats } from "@/lib/insights";
import {
  PRIORITY_LIGHT,
  byId,
  effectivePriority,
  estimateTotals,
  firstName,
  fmtMiles,
  fmtShortDate,
  initials,
  money,
  relStamp,
  sectionChip,
  sectionNote,
  smsHref,
  telHref,
  vehicleLabel,
  vehiclePhoto,
} from "@/lib/utils";

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const state = useShop();
  const c = byId(state.customers, id);
  if (!c) {
    return <EmptyState title="Customer not found" text="This customer isn't in the demo data." action={<Link href="/customers" className="font-semibold text-blue-600">All customers</Link>} />;
  }
  const s = state.settings;
  const vehicles = state.vehicles.filter((v) => v.customerId === c.id);
  const jobs = state.jobs.filter((j) => j.customerId === c.id).sort((a, b) => b.date.localeCompare(a.date));
  const messages = state.messages.filter((m) => m.customerId === c.id).sort((a, b) => b.at.localeCompare(a.at));
  const stats = customerStats(state, c.id);
  const estimates = state.estimates.filter((e) => jobs.some((j) => j.id === e.jobId));
  const approvedValue = estimates.filter((e) => e.status === "approved").reduce((sum, e) => sum + estimateTotals(e, s.taxRate, true).total, 0);

  const openRecs = vehicles.flatMap((v) => {
    const latest = jobs
      .filter((j) => j.vehicleId === v.id)
      .map((j) => state.inspections.find((i) => i.jobId === j.id && i.completedAt))
      .find(Boolean);
    if (!latest) return [];
    return SUMMARY_ORDER.map((sec) => ({ v, sec, p: effectivePriority(latest, sec, s), note: sectionNote(latest, sec), jobId: latest.jobId })).filter(
      (r) => r.p && r.p !== "ok",
    );
  });

  return (
    <div className="space-y-5">
      <Link href="/customers" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft className="size-4" /> All customers
      </Link>

      <Card className="anim-fade-up p-5 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Avatar initials={initials(c.name)} tone="brand" size="lg" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950">{c.name}</h1>
              <p className="text-sm text-slate-500">
                {c.city} · since {c.since} · {vehicles.length} vehicle{vehicles.length === 1 ? "" : "s"} · {jobs.length} visit{jobs.length === 1 ? "" : "s"}
              </p>
              <p className="mt-0.5 text-sm text-slate-700">{c.phone}{c.email ? ` · ${c.email}` : ""}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={telHref(c.phone)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
              <Phone className="size-4" /> Call
            </a>
            <a href={smsHref(c.phone, `Hi ${firstName(c.name)}, this is ${s.shopName}.`)} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
              <MessageSquare className="size-4" /> Text
            </a>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs text-slate-500">Lifetime value</p>
          <p className="mt-1 text-xl font-bold text-emerald-600">{money(Math.round(approvedValue))}</p>
          <p className="text-xs text-slate-500">{estimates.filter((e) => e.status === "approved").length} approved estimates</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">Segment</p>
          <p className="mt-1 text-xl font-bold text-slate-950">{stats.segment}</p>
          <p className="text-xs text-slate-500">{stats.visits} visits · {stats.vehicles} vehicles</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">Open recommendations</p>
          <p className="mt-1 text-xl font-bold text-amber-600">{stats.openRecs}</p>
          <p className="text-xs text-slate-500">across latest inspections</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">Last visit</p>
          <p className="mt-1 text-xl font-bold text-slate-950">{stats.daysSince === null ? "—" : stats.daysSince === 0 ? "Today" : `${stats.daysSince}d ago`}</p>
          <p className="text-xs text-slate-500">{stats.daysSince !== null && stats.daysSince > 180 ? "Win-back candidate 📞" : "Healthy recency"}</p>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {vehicles.map((v) => {
            const vJobs = jobs.filter((j) => j.vehicleId === v.id);
            const media = state.media.filter((m) => m.vehicleId === v.id);
            return (
              <Card key={v.id} className="anim-fade-up scroll-mt-24 overflow-hidden">
                <div id={`vehicle-${v.id}`} className="grid md:grid-cols-[240px_1fr]">
                  <div className="relative min-h-40 bg-slate-900">
                    <img src={vehiclePhoto(v)} alt={vehicleLabel(v)} className="absolute inset-0 h-full w-full object-cover" />
                  </div>
                  <div className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h2 className="text-lg font-bold text-slate-950">{vehicleLabel(v)}</h2>
                        <p className="text-sm text-slate-500">
                          {[v.trim, v.color].filter(Boolean).join(" · ") || "—"} · {fmtMiles(v.mileage)}
                        </p>
                        {v.vin && <p className="font-mono text-[11px] text-slate-400">VIN {v.vin}</p>}
                      </div>
                      <PlateBadge plate={v.plate} />
                    </div>
                    <Link href={`/jobs/new?vehicle=${v.id}`} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100">
                      <Plus className="size-3.5" /> New work order for this vehicle
                    </Link>
                  </div>
                </div>

                <div className="border-t border-slate-100 px-5 py-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Visit history</h3>
                  {vJobs.length === 0 ? (
                    <p className="mt-2 text-sm text-slate-500">No visits yet.</p>
                  ) : (
                    <ul className="mt-2 divide-y divide-slate-100">
                      {vJobs.map((j) => {
                        const ins = state.inspections.find((i) => i.jobId === j.id);
                        const rep = state.reports.find((r) => r.jobId === j.id);
                        return (
                          <li key={j.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <Link href={`/jobs/${j.id}`} className="block truncate text-sm font-semibold text-slate-900 hover:text-blue-600">
                                {j.complaint}
                              </Link>
                              <p className="text-xs text-slate-500">
                                {fmtShortDate(j.date)} · {j.id} · {fmtMiles(j.mileageIn)}
                              </p>
                              {ins && (
                                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600">
                                  {SUMMARY_ORDER.map((sec) => {
                                    const chip = sectionChip(ins, sec, s);
                                    return (
                                      <span key={sec} className="flex items-center gap-1" title={chip.label}>
                                        <LightDot light={chip.light} className="size-2" /> {SECTION_LABEL[sec]}
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <JobStatusBadge status={j.status} />
                              {ins && (
                                <Link href={ins.completedAt ? `/inspections/${j.id}/complete` : `/inspections/${j.id}`} aria-label="Inspection" className="grid size-9 place-items-center rounded-lg ring-1 ring-slate-200 hover:bg-slate-50">
                                  <ClipboardCheck className="size-4" />
                                </Link>
                              )}
                              {ins && (
                                <Link href={`/inspections/${j.id}/sheet`} aria-label="Inspection sheet" className="grid size-9 place-items-center rounded-lg ring-1 ring-slate-200 hover:bg-slate-50">
                                  <FileText className="size-4" />
                                </Link>
                              )}
                              {rep && (
                                <Link href={`/r/${rep.code}`} target="_blank" aria-label="Customer report" className="grid size-9 place-items-center rounded-lg ring-1 ring-slate-200 hover:bg-slate-50">
                                  <ExternalLink className="size-4" />
                                </Link>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <div className="border-t border-slate-100 px-5 py-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Photos &amp; videos ({media.length})</h3>
                    {vJobs[0] && <Link href={`/media?job=${vJobs[0].id}`} className="text-xs font-semibold text-blue-600">Open library</Link>}
                  </div>
                  {media.length === 0 ? (
                    <p className="mt-2 text-sm text-slate-500">No media yet.</p>
                  ) : (
                    <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
                      {media.slice(0, 12).map((m) => (
                        <Link key={m.id} href={`/media?job=${m.jobId}&section=${m.section}`} title={`${MEDIA_SECTION_LABEL[m.section]}: ${m.caption}`} className="group relative aspect-square overflow-hidden rounded-lg bg-slate-900">
                          <img src={m.type === "video" ? m.poster ?? "" : m.url} alt={m.caption} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-110" />
                          {m.type === "video" && (
                            <span className="absolute inset-0 grid place-items-center bg-black/25">
                              <Play className="size-4 fill-white text-white" />
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        <div className="space-y-5">
          <Card className="anim-fade-up p-5">
            <h2 className="font-bold text-slate-950">Open recommendations</h2>
            <p className="text-xs text-slate-500">From each vehicle&apos;s latest inspection</p>
            {openRecs.length === 0 ? (
              <p className="mt-4 text-sm text-emerald-700">Nothing open. All good!</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {openRecs.map((r) => (
                  <li key={`${r.v.id}-${r.sec}`}>
                    <Link href={`/inspections/${r.jobId}/complete`} className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100 hover:bg-blue-50/60">
                      <ShopIcon name={r.sec} className="mt-0.5 size-5 shrink-0 text-slate-600" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900">{SECTION_LABEL[r.sec]} · {r.v.model}</p>
                        <p className="text-xs text-slate-500">{r.note}</p>
                      </div>
                      {r.p && <LightChip light={PRIORITY_LIGHT[r.p]} label={PRIORITY_LABEL[r.p]} size="sm" />}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="anim-fade-up p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-950">Texts</h2>
              <Link href={`/messages?c=${c.id}`} className="text-sm font-semibold text-blue-600">Open thread</Link>
            </div>
            {messages.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No texts yet.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {messages.slice(0, 4).map((m) => (
                  <li key={m.id} className={`rounded-xl px-3 py-2 text-sm ${m.direction === "out" ? "bg-blue-50 text-slate-800" : "bg-slate-100 text-slate-800"}`}>
                    <p className="line-clamp-2">{m.body}</p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {m.direction === "out" ? `Sent by ${byId(state.team, m.by)?.name.split(" ")[0] ?? "shop"}` : firstName(c.name)} · {relStamp(m.at, state.anchorDay)}
                    </p>
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
