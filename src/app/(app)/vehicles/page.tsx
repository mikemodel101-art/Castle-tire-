"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ExternalLink, History, Plus, Search } from "lucide-react";
import { ShopIcon } from "@/components/brand";
import { Card, EmptyState, LightDot, PageHeader, PlateBadge } from "@/components/ui";
import { SECTION_LABEL, SUMMARY_ORDER } from "@/lib/data";
import { useShop } from "@/lib/store";
import { byId, fmtMiles, relDay, sectionChip, vehicleLabel, vehiclePhoto } from "@/lib/utils";

export default function VehiclesPage() {
  const state = useShop();
  const [query, setQuery] = useState("");
  const s = state.settings;

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.vehicles
      .map((v) => {
        const owner = byId(state.customers, v.customerId);
        const jobs = state.jobs.filter((j) => j.vehicleId === v.id).sort((a, b) => b.date.localeCompare(a.date));
        const latest = jobs.map((j) => state.inspections.find((i) => i.jobId === j.id && i.completedAt)).find(Boolean);
        const report = latest ? state.reports.find((r) => r.jobId === latest.jobId) : undefined;
        return { v, owner, jobs, latest, report };
      })
      .filter(({ v, owner }) =>
        !q
          ? true
          : `${vehicleLabel(v)} ${v.plate} ${v.vin} ${owner?.name ?? ""} ${v.color}`.toLowerCase().includes(q.replace(/\s+/g, " ")) ||
            v.plate.toLowerCase().includes(q.replace(/\s/g, "")),
      )
      .sort((a, b) => (b.jobs[0]?.date ?? "").localeCompare(a.jobs[0]?.date ?? ""));
  }, [state, query]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Fleet history"
        title="Vehicles"
        subtitle={`${state.vehicles.length} vehicles with inspections, photos and recommendations on file.`}
        actions={
          <Link href="/jobs/new" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
            <Plus className="size-4" /> New Vehicle
          </Link>
        }
      />
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Plate, VIN, make, model or owner"
          aria-label="Search vehicles"
          className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No vehicles found" text="Try a different plate, VIN or owner name." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map(({ v, owner, jobs, latest, report }) => (
            <Card key={v.id} className="anim-fade-up flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="relative h-40 bg-slate-900">
                <img src={vehiclePhoto(v)} alt={vehicleLabel(v)} className="h-full w-full object-cover" />
                <PlateBadge plate={v.plate} className="absolute bottom-3 right-3" />
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h2 className="font-bold text-slate-950">{vehicleLabel(v)}</h2>
                <p className="text-sm text-slate-500">
                  {[v.trim, v.color].filter(Boolean).join(" · ") || "—"} · {fmtMiles(v.mileage)}
                </p>
                {owner && (
                  <Link href={`/customers/${owner.id}#vehicle-${v.id}`} className="mt-1 text-sm font-semibold text-blue-600 hover:underline">
                    {owner.name}
                  </Link>
                )}
                <p className="mt-2 text-xs text-slate-500">
                  {jobs.length} visit{jobs.length === 1 ? "" : "s"}
                  {jobs[0] ? ` · last ${relDay(jobs[0].date, state.anchorDay)}` : ""}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {SUMMARY_ORDER.map((sec) => {
                    const chip = latest ? sectionChip(latest, sec, s) : { light: "none" as const, label: "—" };
                    return (
                      <span key={sec} title={`${SECTION_LABEL[sec]}: ${chip.label}`} className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-1.5 py-1 ring-1 ring-slate-200">
                        <ShopIcon name={sec} className="size-3.5 text-slate-500" />
                        <LightDot light={chip.light} className="size-2" />
                      </span>
                    );
                  })}
                </div>
                <div className="mt-auto grid grid-cols-3 gap-2 pt-4">
                  <Link href={owner ? `/customers/${owner.id}#vehicle-${v.id}` : "/customers"} className="inline-flex items-center justify-center gap-1 rounded-lg py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
                    <History className="size-3.5" /> History
                  </Link>
                  <Link href={`/jobs/new?vehicle=${v.id}`} className="inline-flex items-center justify-center gap-1 rounded-lg bg-blue-600 py-2 text-xs font-semibold text-white hover:bg-blue-700">
                    <Plus className="size-3.5" /> Work order
                  </Link>
                  {report ? (
                    <Link href={`/r/${report.code}`} target="_blank" className="inline-flex items-center justify-center gap-1 rounded-lg py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
                      <ExternalLink className="size-3.5" /> Report
                    </Link>
                  ) : (
                    <span className="inline-flex items-center justify-center rounded-lg py-2 text-xs text-slate-400 ring-1 ring-slate-100">No report</span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
