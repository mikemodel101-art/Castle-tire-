"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ExternalLink, Printer } from "lucide-react";
import { InspectionSheet } from "@/components/inspection-sheet";
import { EmptyState } from "@/components/ui";
import { useMe, useShop } from "@/lib/store";
import { blankInspection, byId, jobBundle } from "@/lib/utils";

export default function InspectionSheetPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const state = useShop();
  const me = useMe();
  const b = jobBundle(state, jobId);
  if (!b) return <EmptyState title="Job not found" text="This work order doesn't exist." />;
  const inspection = b.inspection ?? blankInspection(jobId, me.id);
  const techName = byId(state.team, inspection.techId ?? b.job.assignedTo)?.name ?? "";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={`/jobs/${jobId}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
          <ArrowLeft className="size-4" /> Back to job
        </Link>
        <div className="flex gap-2">
          {b.report && (
            <Link href={`/r/${b.report.code}`} target="_blank" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50">
              <ExternalLink className="size-4" /> Customer view
            </Link>
          )}
          <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
            <Printer className="size-4" /> Print / Save PDF
          </button>
        </div>
      </div>
      <InspectionSheet job={b.job} customer={b.customer} vehicle={b.vehicle} inspection={inspection} techName={techName} settings={state.settings} />
    </div>
  );
}
