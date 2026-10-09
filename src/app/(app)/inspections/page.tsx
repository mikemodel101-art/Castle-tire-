"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Clock, Download, Search, Timer } from "lucide-react";
import { ShopIcon } from "@/components/brand";
import { Card, EmptyState, LightChip, LightDot, PageHeader, PlateBadge } from "@/components/ui";
import { HelpTip } from "@/components/onboarding";
import { SECTION_LABEL, SUMMARY_ORDER } from "@/lib/data";
import { useShop } from "@/lib/store";
import { inspectionStats } from "@/lib/insights";
import { byId, inspectionProgress, overallLight, relDay, sectionChip, slotMinutes, vehicleLabel, vehiclePhoto } from "@/lib/utils";

type Filter = "progress" | "complete" | "all";

export default function InspectionsPage() {
  const state = useShop();
  const [filter, setFilter] = useState<Filter>("progress");
  const [query, setQuery] = useState("");
  const [tech, setTech] = useState("all");
  const [onlyRed, setOnlyRed] = useState(false);
  const s = state.settings;
  const stats = inspectionStats(state);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.jobs
      .map((job) => ({ job, ins: state.inspections.find((i) => i.jobId === job.id) }))
      .filter(({ job, ins }) => ins || job.date === state.anchorDay)
      .filter(({ job, ins }) => {
        if (filter === "complete") return Boolean(ins?.completedAt);
        if (filter === "progress") return !ins?.completedAt && job.status !== "completed";
        return true;
      })
      .filter(({ job }) => (tech === "all" ? true : job.assignedTo === tech))
      .filter(({ ins }) => {
        if (!onlyRed || !ins) return true;
        return overallLight(ins, s) === "red";
      })
      .filter(({ job }) => {
        if (!q) return true;
        const c = byId(state.customers, job.customerId);
        const v = byId(state.vehicles, job.vehicleId);
        return `${c?.name ?? ""} ${v ? vehicleLabel(v) : ""} ${v?.plate ?? ""} ${job.id} ${job.complaint}`.toLowerCase().includes(q);
      })
      .sort((a, b) => b.job.date.localeCompare(a.job.date) || slotMinutes(a.job.time) - slotMinutes(b.job.time));
  }, [state, filter, tech, onlyRed, query, s]);

  const exportCsv = () => {
    const header = "Job,Date,Time,Customer,Vehicle,Plate,Tech,Progress,Overall,Tires,Brakes,TPMS,Suspension,Alignment";
    const lines = rows.map(({ job, ins }) => {
      const c = byId(state.customers, job.customerId);
      const v = byId(state.vehicles, job.vehicleId);
      const t = byId(state.team, job.assignedTo);
      const cells = [
        job.id, job.date, job.time, c?.name ?? "", v ? vehicleLabel(v) : "", v?.plate ?? "", t?.name ?? "",
        ins ? `${inspectionProgress(ins, s)}%` : "0%",
        ins ? sectionChip(ins, "tires", s).label : "",
      ];
      return cells.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",");
    });
    const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inspections.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Digital vehicle inspections"
        title={
          <span>
            Inspections
            <HelpTip title="Same sheet, digital">
              Tread in /32 and pads in mm auto-pick the color: green good, yellow soon, red replace. Tap any row to continue or review.
            </HelpTip>
          </span>
        }
        subtitle="Your paper sheet, digital: tires, brakes, TPMS, suspension and alignment with green / yellow / red status."
        actions={
          <button type="button" onClick={exportCsv} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
            <Download className="size-4" /> Export CSV
          </button>
        }
      />

      <div className="anim-fade-up grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { light: "green" as const, title: "Good / OK", text: "No action needed" },
          { light: "blue" as const, title: "Future", text: "Watch at next visit" },
          { light: "yellow" as const, title: "Soon", text: "Plan the repair" },
          { light: "red" as const, title: "Replace / Now", text: "Unsafe, fix today" },
        ].map((l) => (
          <div key={l.title} className="flex items-center gap-2.5 rounded-xl bg-white p-3 ring-1 ring-slate-200">
            <LightDot light={l.light} className="size-3.5" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">{l.title}</p>
              <p className="truncate text-xs text-slate-500">{l.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="p-4">
          <p className="flex items-center gap-1.5 text-xs text-slate-500"><Timer className="size-3.5" /> Avg inspection</p>
          <p className="mt-1 text-2xl font-bold text-slate-950">{stats.avgMins}m</p>
          <p className="text-xs text-slate-500">{stats.todayDone} done today</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">Needs work now</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{stats.red}</p>
          <p className="text-xs text-slate-500">red overall</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">Plan soon</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{stats.yellow}</p>
          <p className="text-xs text-slate-500">yellow overall</p>
        </Card>
        <Card className="p-4">
          <p className="flex items-center gap-1.5 text-xs text-slate-500"><Clock className="size-3.5" /> Completion</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">{stats.total ? Math.round((stats.done / stats.total) * 100) : 0}%</p>
          <p className="text-xs text-slate-500">{stats.done}/{stats.total} inspections</p>
        </Card>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative w-full md:max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search customer, plate, job…" className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15" />
        </div>
        <div className="flex w-fit rounded-full bg-white p-1 ring-1 ring-slate-200">
          {(["progress", "complete", "all"] as Filter[]).map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)} className={`h-9 rounded-full px-4 text-sm font-semibold transition ${filter === f ? "bg-slate-950 text-white" : "text-slate-600"}`}>
              {f === "progress" ? "To do / in progress" : f === "complete" ? "Complete" : "All"}
            </button>
          ))}
        </div>
        <select value={tech} onChange={(e) => setTech(e.target.value)} aria-label="Filter by technician" className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600">
          <option value="all">All techs</option>
          {state.team.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <button type="button" onClick={() => setOnlyRed((v) => !v)} className={`inline-flex h-11 items-center rounded-xl px-4 text-sm font-bold ring-1 transition ${onlyRed ? "bg-red-600 text-white ring-red-600" : "bg-white text-slate-600 ring-slate-200"}`}>
          Red only
        </button>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="Nothing here" text={onlyRed ? "No red inspections in this view — that's good news." : "Inspections appear once a technician accepts a job."} action={<Link href="/jobs" className="font-semibold text-blue-600">Go to Today&apos;s Jobs</Link>} />
      ) : (
        <Card className="anim-fade-up overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {rows.map(({ job, ins }) => {
              const customer = byId(state.customers, job.customerId);
              const vehicle = byId(state.vehicles, job.vehicleId);
              const techM = byId(state.team, job.assignedTo);
              if (!customer || !vehicle) return null;
              const pct = inspectionProgress(ins, s);
              const href = ins?.completedAt ? `/inspections/${job.id}/complete` : `/inspections/${job.id}`;
              const overall = ins ? overallLight(ins, s) : "none";
              const media = state.media.filter((m) => m.jobId === job.id).length;
              return (
                <li key={job.id}>
                  <Link href={href} className="grid gap-3 px-4 py-4 transition hover:bg-slate-50/80 sm:px-5 lg:grid-cols-[1.3fr_1.4fr_auto] lg:items-center">
                    <div className="flex min-w-0 items-center gap-3">
                      <img src={vehiclePhoto(vehicle)} alt="" className="h-12 w-16 shrink-0 rounded-lg object-cover" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">{vehicleLabel(vehicle)} <span className="font-mono text-xs text-slate-400">{job.id}</span></p>
                        <p className="truncate text-xs text-slate-500">{customer.name} · {relDay(job.date, state.anchorDay)} {job.time} · {techM?.name ?? "Unassigned"} · {media} media</p>
                        <PlateBadge plate={vehicle.plate} className="mt-1" />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {SUMMARY_ORDER.map((sec) => {
                        const chip = ins ? sectionChip(ins, sec, s) : { light: "none" as const, label: "—" };
                        return (
                          <span key={sec} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1 text-xs text-slate-700 ring-1 ring-slate-200" title={`${SECTION_LABEL[sec]}: ${chip.label}`}>
                            <ShopIcon name={sec} className="size-3.5 text-slate-500" />
                            <LightDot light={chip.light} className="size-2" />
                            <span className="hidden sm:inline">{SECTION_LABEL[sec]}</span>
                          </span>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-between gap-3 lg:justify-end">
                      {ins?.completedAt ? <LightChip light={overall} label="Complete" /> : (
                        <span className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                          <span className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
                            <span className="block h-full rounded-full bg-blue-600" style={{ width: `${pct}%` }} />
                          </span>
                          {ins ? `${pct}%` : "Not started"}
                        </span>
                      )}
                      <ArrowRight className="size-4 text-slate-300" />
                    </div>
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
