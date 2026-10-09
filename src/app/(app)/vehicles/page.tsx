"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, ArrowUpDown, ExternalLink, History, Plus, Search, Wrench } from "lucide-react";
import { ShopIcon } from "@/components/brand";
import { Card, EmptyState, LightDot, PageHeader, PlateBadge } from "@/components/ui";
import { HelpTip } from "@/components/onboarding";
import { SECTION_LABEL, SUMMARY_ORDER } from "@/lib/data";
import { useShop } from "@/lib/store";
import { vehicleService } from "@/lib/insights";
import { byId, fmtMiles, relDay, sectionChip, vehicleLabel, vehiclePhoto } from "@/lib/utils";

type SortKey = "recent" | "mileage" | "visits";

export default function VehiclesPage() {
  const state = useShop();
  const [query, setQuery] = useState("");
  const [make, setMake] = useState("all");
  const [dueOnly, setDueOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("recent");
  const s = state.settings;

  const makes = useMemo(() => [...new Set(state.vehicles.map((v) => v.make))].sort(), [state.vehicles]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = state.vehicles
      .map((v) => {
        const owner = byId(state.customers, v.customerId);
        const jobs = state.jobs.filter((j) => j.vehicleId === v.id).sort((a, b) => b.date.localeCompare(a.date));
        const latest = jobs.map((j) => state.inspections.find((i) => i.jobId === j.id && i.completedAt)).find(Boolean);
        const report = latest ? state.reports.find((r) => r.jobId === latest.jobId) : undefined;
        const svc = vehicleService(state, v.id);
        return { v, owner, jobs, latest, report, svc };
      })
      .filter(({ v, owner, svc }) => {
        if (make !== "all" && v.make !== make) return false;
        if (dueOnly && !svc.dueRotation) return false;
        if (!q) return true;
        return (
          `${vehicleLabel(v)} ${v.plate} ${v.vin} ${owner?.name ?? ""} ${v.color}`.toLowerCase().includes(q.replace(/\s+/g, " ")) ||
          v.plate.toLowerCase().includes(q.replace(/\s/g, ""))
        );
      });
    if (sort === "mileage") list.sort((a, b) => b.v.mileage - a.v.mileage);
    else if (sort === "visits") list.sort((a, b) => b.jobs.length - a.jobs.length);
    else list.sort((a, b) => (b.jobs[0]?.date ?? "").localeCompare(a.jobs[0]?.date ?? ""));
    return list;
  }, [state, query, make, dueOnly, sort]);

  const dueCount = state.vehicles.filter((v) => vehicleService(state, v.id).dueRotation).length;
  const avgMiles = Math.round(state.vehicles.reduce((a, v) => a + v.mileage, 0) / Math.max(1, state.vehicles.length));
  const redCount = rows.filter((r) => r.svc.worst === "red").length;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Fleet history"
        title={
          <span>
            Vehicles
            <HelpTip title="Every car has a memory">
              Latest inspection colors, visit count, mileage and service-due badges. “Due” = 6+ months, 6k+ miles, or yellow/red findings.
            </HelpTip>
          </span>
        }
        subtitle={`${state.vehicles.length} vehicles · ${dueCount} due for service · avg ${avgMiles.toLocaleString()} mi`}
        actions={
          <Link href="/jobs/new" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
            <Plus className="size-4" /> New Vehicle
          </Link>
        }
      />

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4">
          <p className="text-xs text-slate-500">Due for service</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{dueCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">Red findings</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{redCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">Total visits</p>
          <p className="mt-1 text-2xl font-bold text-slate-950">{state.jobs.length}</p>
        </Card>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative w-full lg:max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Plate, VIN, make, model or owner"
            aria-label="Search vehicles"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={make} onChange={(e) => setMake(e.target.value)} aria-label="Filter by make" className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600">
            <option value="all">All makes</option>
            {makes.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <button type="button" onClick={() => setDueOnly((v) => !v)} className={`inline-flex h-11 items-center gap-1.5 rounded-xl px-4 text-sm font-bold ring-1 transition ${dueOnly ? "bg-amber-400 text-slate-950 ring-amber-400" : "bg-white text-slate-600 ring-slate-200"}`}>
            <Wrench className="size-4" /> Due only{dueCount ? ` (${dueCount})` : ""}
          </button>
          <button type="button" onClick={() => setSort(sort === "recent" ? "mileage" : sort === "mileage" ? "visits" : "recent")} className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-white px-4 text-sm font-semibold text-slate-600 ring-1 ring-slate-200">
            <ArrowUpDown className="size-4" /> Sort: {sort}
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No vehicles found" text="Try a different plate, VIN or owner name — or clear the Due filter." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map(({ v, owner, jobs, latest, report, svc }) => (
            <Card key={v.id} className={`anim-fade-up flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md ${svc.worst === "red" ? "ring-2 ring-red-500" : ""}`}>
              <div className="relative h-40 bg-slate-900">
                <img src={vehiclePhoto(v)} alt={vehicleLabel(v)} className="h-full w-full object-cover" />
                <PlateBadge plate={v.plate} className="absolute bottom-3 right-3" />
                {svc.dueRotation && (
                  <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-black text-slate-950 shadow">
                    <AlertTriangle className="size-3" /> {svc.due.toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h2 className="font-bold text-slate-950">{vehicleLabel(v)}</h2>
                <p className="text-sm text-slate-500">{[v.trim, v.color].filter(Boolean).join(" · ") || "—"} · {fmtMiles(v.mileage)}</p>
                {owner && (
                  <Link href={`/customers/${owner.id}#vehicle-${v.id}`} className="mt-1 text-sm font-semibold text-blue-600 hover:underline">
                    {owner.name}
                  </Link>
                )}
                <p className="mt-2 text-xs text-slate-500">
                  {jobs.length} visit{jobs.length === 1 ? "" : "s"}
                  {jobs[0] ? ` · last ${relDay(jobs[0].date, state.anchorDay)}` : " · never visited"}
                  {svc.milesSince > 0 ? ` · +${svc.milesSince.toLocaleString()} mi` : ""}
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
                  <span className="ml-auto text-[11px] font-bold text-slate-400">{svc.due}</span>
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
