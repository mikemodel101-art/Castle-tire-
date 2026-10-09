"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { ShopIcon } from "@/components/brand";
import { Card, EmptyState, LightChip, LightDot, PageHeader, PlateBadge } from "@/components/ui";
import { SECTION_LABEL, SUMMARY_ORDER } from "@/lib/data";
import { useShop } from "@/lib/store";
import { byId, inspectionProgress, overallLight, relDay, sectionChip, slotMinutes, vehicleLabel, vehiclePhoto } from "@/lib/utils";

type Filter = "progress" | "complete" | "all";

export default function InspectionsPage() {
  const state = useShop();
  const [filter, setFilter] = useState<Filter>("progress");
  const s = state.settings;

  const rows = state.jobs
    .map((job) => ({ job, ins: state.inspections.find((i) => i.jobId === job.id) }))
    .filter(({ job, ins }) => ins || job.date === state.anchorDay)
    .filter(({ job, ins }) => {
      if (filter === "complete") return Boolean(ins?.completedAt);
      if (filter === "progress") return !ins?.completedAt && job.status !== "completed";
      return true;
    })
    .sort((a, b) => b.job.date.localeCompare(a.job.date) || slotMinutes(a.job.time) - slotMinutes(b.job.time));

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Digital vehicle inspections"
        title="Inspections"
        subtitle="Your paper sheet, digital: tires, brakes, TPMS, suspension and alignment with green / yellow / red status."
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

      <div className="flex w-fit rounded-full bg-white p-1 ring-1 ring-slate-200">
        {(["progress", "complete", "all"] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`h-9 rounded-full px-4 text-sm font-semibold transition ${filter === f ? "bg-slate-950 text-white" : "text-slate-600"}`}
          >
            {f === "progress" ? "To do / in progress" : f === "complete" ? "Complete" : "All"}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState title="Nothing here" text="Inspections appear once a technician accepts a job." />
      ) : (
        <Card className="anim-fade-up overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {rows.map(({ job, ins }) => {
              const customer = byId(state.customers, job.customerId);
              const vehicle = byId(state.vehicles, job.vehicleId);
              const tech = byId(state.team, job.assignedTo);
              if (!customer || !vehicle) return null;
              const pct = inspectionProgress(ins, s);
              const href = ins?.completedAt ? `/inspections/${job.id}/complete` : `/inspections/${job.id}`;
              const overall = ins ? overallLight(ins, s) : "none";
              return (
                <li key={job.id}>
                  <Link href={href} className="grid gap-3 px-4 py-4 transition hover:bg-slate-50/80 sm:px-5 lg:grid-cols-[1.3fr_1.4fr_auto] lg:items-center">
                    <div className="flex min-w-0 items-center gap-3">
                      <img src={vehiclePhoto(vehicle)} alt="" className="h-12 w-16 shrink-0 rounded-lg object-cover" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">{vehicleLabel(vehicle)}</p>
                        <p className="truncate text-xs text-slate-500">
                          {customer.name} · {relDay(job.date, state.anchorDay)} {job.time} · {tech?.name ?? "Unassigned"}
                        </p>
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
                      {ins?.completedAt ? (
                        <LightChip light={overall} label="Complete" />
                      ) : (
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
