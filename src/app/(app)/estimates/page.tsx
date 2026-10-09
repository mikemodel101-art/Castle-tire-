"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowRight, ArrowUpDown, Plus, Receipt, Search } from "lucide-react";
import { Funnel } from "@/components/analytics";
import { Card, EmptyState, PageHeader, PlateBadge } from "@/components/ui";
import { HelpTip } from "@/components/onboarding";
import type { EstimateStatus } from "@/lib/data";
import { createEstimate, useShop } from "@/lib/store";
import { estimateFunnel } from "@/lib/insights";
import { byId, estimateTotals, money, relDay, relStamp, vehicleLabel, vehiclePhoto } from "@/lib/utils";

const STATUS_STYLE: Record<EstimateStatus, string> = {
  draft: "bg-slate-100 text-slate-700 ring-slate-300",
  sent: "bg-amber-100 text-amber-800 ring-amber-400/40",
  approved: "bg-emerald-100 text-emerald-800 ring-emerald-500/30",
  declined: "bg-red-100 text-red-800 ring-red-500/30",
};

type SortKey = "newest" | "total" | "oldest";

export default function EstimatesPage() {
  const state = useShop();
  const router = useRouter();
  const [filter, setFilter] = useState<EstimateStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const s = state.settings;
  const funnel = estimateFunnel(state);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out = [...state.estimates]
      .filter((e) => (filter === "all" ? true : e.status === filter))
      .filter((e) => {
        if (!q) return true;
        const job = byId(state.jobs, e.jobId);
        const c = job ? byId(state.customers, job.customerId) : undefined;
        const v = job ? byId(state.vehicles, job.vehicleId) : undefined;
        return `${e.id} ${c?.name ?? ""} ${v ? vehicleLabel(v) : ""} ${v?.plate ?? ""} ${e.lines.map((l) => l.description).join(" ")}`.toLowerCase().includes(q);
      });
    if (sort === "total") out.sort((a, b) => estimateTotals(b, s.taxRate).total - estimateTotals(a, s.taxRate).total);
    else if (sort === "oldest") out.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    else out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return out;
  }, [state, filter, query, sort, s.taxRate]);

  const ready = state.inspections
    .filter((i) => i.completedAt && !state.estimates.some((e) => e.jobId === i.jobId))
    .map((i) => ({ ins: i, job: byId(state.jobs, i.jobId) }))
    .filter((r) => r.job && r.job.status !== "completed")
    .slice(0, 6);

  const awaitingTotal = state.estimates.filter((e) => e.status === "sent").reduce((sum, e) => sum + estimateTotals(e, s.taxRate).total, 0);
  const approvedTotal = state.estimates.filter((e) => e.status === "approved").reduce((sum, e) => sum + estimateTotals(e, s.taxRate, true).total, 0);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Repair estimates"
        title={
          <span>
            Estimates
            <HelpTip title="From findings to yes">
              Estimates auto-build from red/yellow findings. Draft → Sent → Approved. Follow up anything sent 2+ days ago — those go cold fast.
            </HelpTip>
          </span>
        }
        subtitle="Built from inspection findings. Customers can approve from their report link."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="anim-fade-up grid grid-cols-2 gap-3">
          <Card className="p-4">
            <p className="text-xs text-slate-500">Awaiting approval</p>
            <p className="mt-1 text-2xl font-bold text-amber-600">{money(awaitingTotal)}</p>
            <p className="text-xs text-slate-500">{funnel.stale} going cold (2+ days)</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-slate-500">Approved work</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{money(approvedTotal)}</p>
            <p className="text-xs text-slate-500">{funnel.conversion}% close rate</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-slate-500">Estimates</p>
            <p className="mt-1 text-2xl font-bold text-slate-950">{state.estimates.length}</p>
            <p className="text-xs text-slate-500">{funnel.draft} drafts</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-slate-500">Ready to estimate</p>
            <p className="mt-1 text-2xl font-bold text-blue-600">{ready.length}</p>
            <p className="text-xs text-slate-500">inspections without one</p>
          </Card>
        </div>
        <Card className="anim-fade-up p-4">
          <h2 className="text-sm font-bold text-slate-900">Pipeline</h2>
          <p className="text-xs text-slate-500">Where every dollar sits</p>
          <div className="mt-3">
            <Funnel
              steps={[
                { label: "Draft", value: funnel.draft, color: "#64748b" },
                { label: "Sent", value: funnel.sent, color: "#f59e0b" },
                { label: "Approved", value: funnel.approved, color: "#10b981" },
                { label: "Declined", value: funnel.declined, color: "#ef4444" },
              ]}
            />
          </div>
        </Card>
      </div>

      {ready.length > 0 && (
        <Card className="anim-fade-up border-l-4 border-l-blue-500 p-4">
          <h2 className="text-sm font-bold text-slate-900">Completed inspections without an estimate — make money in one tap</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {ready.map(({ ins, job }) => {
              const v = job ? byId(state.vehicles, job.vehicleId) : undefined;
              return (
                <button key={ins.jobId} type="button" onClick={() => router.push(`/estimates/${createEstimate(ins.jobId)}`)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                  <Plus className="size-4" /> {v ? `${v.year} ${v.make} ${v.model}` : ins.jobId}
                </button>
              );
            })}
          </div>
        </Card>
      )}

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative w-full md:max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search customer, vehicle, repair…" className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15" />
        </div>
        <div className="flex w-fit flex-wrap gap-1 rounded-full bg-white p-1 ring-1 ring-slate-200">
          {(["all", "draft", "sent", "approved", "declined"] as const).map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)} className={`h-8 rounded-full px-3.5 text-xs font-semibold capitalize transition ${filter === f ? "bg-slate-950 text-white" : "text-slate-600"}`}>
              {f}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setSort(sort === "newest" ? "total" : sort === "total" ? "oldest" : "newest")} className="inline-flex h-10 w-fit items-center gap-1.5 rounded-full bg-white px-4 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
          <ArrowUpDown className="size-3.5" /> Sort: {sort}
        </button>
      </div>

      {list.length === 0 ? (
        <EmptyState title="No estimates here" text="Create one from an Inspection Complete screen — or tap a blue button above." action={<Link href="/inspections" className="font-semibold text-blue-600">Go to inspections</Link>} />
      ) : (
        <Card className="anim-fade-up overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {list.map((e) => {
              const job = byId(state.jobs, e.jobId);
              const c = job ? byId(state.customers, job.customerId) : undefined;
              const v = job ? byId(state.vehicles, job.vehicleId) : undefined;
              const t = estimateTotals(e, s.taxRate);
              const age = e.sentAt ? Math.max(0, Math.round((Date.now() - new Date(e.sentAt).getTime()) / 86400000)) : 0;
              return (
                <li key={e.id}>
                  <Link href={`/estimates/${e.id}`} className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-slate-50 sm:px-5">
                    {v ? <img src={vehiclePhoto(v)} alt="" className="h-12 w-16 shrink-0 rounded-lg object-cover" /> : <span className="grid h-12 w-16 place-items-center rounded-lg bg-slate-100"><Receipt className="size-5 text-slate-400" /></span>}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">
                        {e.id} · {c?.name}
                        {e.status === "sent" && age >= 2 && <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-black text-amber-800">FOLLOW UP</span>}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {v ? vehicleLabel(v) : ""} · {e.lines.length} item{e.lines.length === 1 ? "" : "s"} · created {relDay(e.createdAt, state.anchorDay)}
                        {e.sentAt ? ` · sent ${relStamp(e.sentAt, state.anchorDay)}` : " · not sent"}
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
  );
}
