import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, PageHeader, StatusBadge, StatusDot } from "@/components/ui";
import { JOBS, TODAY } from "@/lib/data";
import {
  customerForJob,
  findInspectionByJob,
  findMember,
  formatDate,
  inspectionForJob,
  sectionStatuses,
  vehicleForJob,
  vehicleLabel,
} from "@/lib/utils";

export const metadata = { title: "Inspections" };

export default function InspectionsPage() {
  const rows = JOBS.filter((j) => j.date === TODAY || j.stage >= 1)
    .sort((a, b) => b.date.localeCompare(a.date) || a.time.localeCompare(b.time));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Digital vehicle inspections"
        title="Inspections"
        subtitle="Green, yellow and red status for every vehicle. Open a job to fill in the inspection sheet."
      />

      <div className="anim-fade-up grid gap-3 sm:grid-cols-3">
        {[
          { color: "green" as const, title: "Pass", text: "Within spec, no action needed" },
          { color: "yellow" as const, title: "Monitor", text: "Watch it, plan the repair soon" },
          { color: "red" as const, title: "Repair", text: "Unsafe or out of spec, fix now" },
        ].map((l) => (
          <div key={l.title} className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <StatusDot status={l.color} />
            <div>
              <p className="text-sm font-semibold text-slate-900">{l.title}</p>
              <p className="text-xs text-slate-500">{l.text}</p>
            </div>
          </div>
        ))}
      </div>

      <Card className="anim-fade-up overflow-hidden">
        <ul className="divide-y divide-slate-100">
          {rows.map((job) => {
            const customer = customerForJob(job);
            const vehicle = vehicleForJob(job);
            const tech = findMember(job.assignedTo);
            const ins = inspectionForJob(job);
            const s = sectionStatuses(ins);
            const hasRecord = !!findInspectionByJob(job.id);
            return (
              <li key={job.id}>
                <Link href={`/inspections/${job.id}`} className="grid gap-3 px-5 py-4 transition hover:bg-slate-50/80 md:grid-cols-[1.4fr_1fr_auto] md:items-center">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">
                      {vehicle ? vehicleLabel(vehicle) : "Vehicle"} <span className="font-mono text-xs text-slate-500">· {vehicle?.plate}</span>
                    </p>
                    <p className="truncate text-sm text-slate-600">
                      {customer?.name} · {job.service}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {formatDate(job.date)} · {job.time} · {tech?.name ?? "Unassigned"} · {hasRecord ? "Saved sheet" : "Blank sheet"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600">
                    {[
                      ["Tires", s.tires],
                      ["Brakes", s.brakes],
                      ["TPMS", s.tpms],
                      ["Susp.", s.suspension],
                      ["Align", s.alignment],
                    ].map(([label, st]) => (
                      <span key={label as string} className="flex items-center gap-1.5">
                        <StatusDot status={st as "green" | "yellow" | "red" | "pending"} />
                        {label as string}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between gap-3 md:justify-end">
                    <StatusBadge status={s.overall} />
                    <ArrowRight className="size-4 text-slate-300" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
