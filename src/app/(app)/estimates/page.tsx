"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Plus, Receipt } from "lucide-react";
import { Card, EmptyState, InfoPanel, OnboardingBanner, PageHeader, PlateBadge } from "@/components/ui";
import { APP_JOURNEY } from "@/lib/help";
import type { EstimateStatus } from "@/lib/data";
import { createEstimate, useShop } from "@/lib/store";
import { byId, estimateTotals, money, relDay, relStamp, vehicleLabel, vehiclePhoto } from "@/lib/utils";

const STATUS_STYLE: Record<EstimateStatus, string> = {
  draft: "bg-slate-100 text-slate-700 ring-slate-300",
  sent: "bg-amber-100 text-amber-800 ring-amber-400/40",
  approved: "bg-emerald-100 text-emerald-800 ring-emerald-500/30",
  declined: "bg-red-100 text-red-800 ring-red-500/30",
};

export default function EstimatesPage() {
  const state = useShop();
  const router = useRouter();
  const [filter, setFilter] = useState<EstimateStatus | "all">("all");
  const s = state.settings;

  const list = [...state.estimates]
    .filter((e) => filter === "all" || e.status === filter)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const ready = state.inspections
    .filter((i) => i.completedAt && !state.estimates.some((e) => e.jobId === i.jobId))
    .map((i) => ({ ins: i, job: byId(state.jobs, i.jobId) }))
    .filter((r) => r.job && r.job.status !== "completed")
    .slice(0, 6);

  const awaitingTotal = state.estimates
    .filter((e) => e.status === "sent")
    .reduce((sum, e) => sum + estimateTotals(e, s.taxRate).total, 0);
  const approvedTotal = state.estimates
    .filter((e) => e.status === "approved")
    .reduce((sum, e) => sum + estimateTotals(e, s.taxRate, true).total, 0);

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Repair estimates" title="Estimates" subtitle="Built from inspection findings. Customers can approve from their report link." />

      <OnboardingBanner
        title="Estimates are the bridge between diagnosis and approval"
        text="Once the inspection is complete, the estimate turns findings into parts, labor, tax and a clear customer decision."
        points={[APP_JOURNEY[3].title, APP_JOURNEY[4].title]}
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <div className="anim-fade-up grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Card className="p-4">
              <p className="text-xs text-slate-500">Awaiting approval</p>
              <p className="mt-1 text-2xl font-bold text-amber-600">{money(awaitingTotal)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-slate-500">Approved work</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600">{money(approvedTotal)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-slate-500">Estimates</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">{state.estimates.length}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-slate-500">Ready to estimate</p>
              <p className="mt-1 text-2xl font-bold text-blue-600">{ready.length}</p>
            </Card>
          </div>

          {ready.length > 0 && (
            <Card className="anim-fade-up p-4">
              <h2 className="text-sm font-bold text-slate-900">Completed inspections without an estimate</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {ready.map(({ ins, job }) => {
                  const v = job ? byId(state.vehicles, job.vehicleId) : undefined;
                  return (
                    <button
                      key={ins.jobId}
                      type="button"
                      onClick={() => router.push(`/estimates/${createEstimate(ins.jobId)}`)}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800 ring-1 ring-blue-200 hover:bg-blue-100"
                    >
                      <Plus className="size-4" /> {v ? `${v.year} ${v.make} ${v.model}` : ins.jobId}
                    </button>
                  );
                })}
              </div>
            </Card>
          )}

          <div className="flex w-fit flex-wrap gap-1 rounded-full bg-white p-1 ring-1 ring-slate-200">
            {(["all", "draft", "sent", "approved", "declined"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`h-8 rounded-full px-3.5 text-xs font-semibold capitalize transition ${filter === f ? "bg-slate-950 text-white" : "text-slate-600"}`}
              >
                {f}
              </button>
            ))}
          </div>

          {list.length === 0 ? (
            <EmptyState
              title="No estimates here"
              text="Create one from an Inspection Complete screen."
              action={<Link href="/inspections" className="font-semibold text-blue-600">Go to inspections</Link>}
            />
          ) : (
            <Card className="anim-fade-up overflow-hidden">
              <ul className="divide-y divide-slate-100">
                {list.map((e) => {
                  const job = byId(state.jobs, e.jobId);
                  const c = job ? byId(state.customers, job.customerId) : undefined;
                  const v = job ? byId(state.vehicles, job.vehicleId) : undefined;
                  const t = estimateTotals(e, s.taxRate);
                  return (
                    <li key={e.id}>
                      <Link href={`/estimates/${e.id}`} className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-slate-50 sm:px-5">
                        {v ? (
                          <img src={vehiclePhoto(v)} alt="" className="h-12 w-16 shrink-0 rounded-lg object-cover" />
                        ) : (
                          <span className="grid h-12 w-16 place-items-center rounded-lg bg-slate-100"><Receipt className="size-5 text-slate-400" /></span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-slate-900">
                            {e.id} · {c?.name}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {v ? vehicleLabel(v) : ""} · {e.lines.length} item{e.lines.length === 1 ? "" : "s"} · created {relDay(e.createdAt, state.anchorDay)}
                            {e.sentAt ? ` · sent ${relStamp(e.sentAt, state.anchorDay)}` : ""}
                          </p>
                        </div>
                        {v && <PlateBadge plate={v.plate} className="hidden sm:inline-flex" />}
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-bold text-slate-950">{money(t.total, true)}</span>
                          <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize ring-1 ring-inset ${STATUS_STYLE[e.status]}`}>{e.status}</span>
                        </div>
                        <ArrowRight className="size-4 shrink-0 text-slate-300" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <InfoPanel
            title="How to read this page"
            text="Draft means the estimate exists but has not been texted. Sent means the customer was asked to review it. Approved and Declined reflect the customer's decision."
            tip="Use Ready to estimate at the top to turn a fresh inspection into an estimate quickly."
          />
        </div>
      </div>
    </div>
  );
}
