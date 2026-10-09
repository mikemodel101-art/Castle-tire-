"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, ClipboardCheck, ExternalLink, FileText, MessageSquare, Pencil, Play, Receipt } from "lucide-react";
import { ShopIcon } from "@/components/brand";
import { SendReportModal } from "@/components/send-report-modal";
import { Toast, useToast } from "@/components/toast";
import { Card, EmptyState, SolidChip } from "@/components/ui";
import { MEDIA_SECTION_LABEL, SECTION_LABEL, SUMMARY_ORDER } from "@/lib/data";
import { createEstimate, useShop } from "@/lib/store";
import { byId, fmtDate, fmtMiles, fmtTime, jobBundle, overallLight, sectionChip, sectionNote, vehicleLabel, vehiclePhoto } from "@/lib/utils";

export default function InspectionCompletePage() {
  const { jobId } = useParams<{ jobId: string }>();
  const state = useShop();
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [toast, showToast] = useToast();

  const b = jobBundle(state, jobId);
  if (!b) return <EmptyState title="Job not found" text="This work order doesn't exist." />;
  const { job, customer, vehicle, inspection, report, estimate, media } = b;
  const s = state.settings;

  if (!inspection?.completedAt) {
    return (
      <EmptyState
        title="Inspection not complete yet"
        text="Finish the inspection steps and tap Complete Inspection to build the customer summary."
        action={
          <Link href={`/inspections/${job.id}`} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">
            <ClipboardCheck className="size-4" /> Continue inspection
          </Link>
        }
      />
    );
  }

  const techName = byId(state.team, inspection.techId)?.name ?? "Technician";
  const overall = overallLight(inspection, s);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link href={`/jobs/${job.id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft className="size-4" /> Back to job
      </Link>

      <Card className="anim-fade-up overflow-hidden">
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <span className="anim-pop grid size-10 place-items-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
            <CheckCircle2 className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-slate-950 sm:text-2xl">Inspection Complete</h1>
            <p className="text-sm text-slate-500">Shop &amp; customer view</p>
          </div>
          {report?.sentAt && (
            <span className="hidden rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20 sm:inline">
              Sent {fmtTime(report.sentAt)}
            </span>
          )}
        </div>

        <div className="grid gap-5 p-5 sm:grid-cols-[220px_1fr] sm:p-6">
          <img src={vehiclePhoto(vehicle)} alt={vehicleLabel(vehicle)} className="aspect-[4/3] w-full rounded-2xl object-cover sm:aspect-auto sm:h-full" />
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">{vehicleLabel(vehicle)}</h2>
            <p className="mt-0.5 text-slate-600">
              {vehicle.plate} &nbsp;|&nbsp; {fmtMiles(job.mileageIn || vehicle.mileage)}
            </p>
            <dl className="mt-4 grid gap-1.5 text-sm">
              <div className="flex gap-2"><dt className="w-28 text-slate-500">Customer:</dt><dd className="font-medium text-slate-900">{customer.name}</dd></div>
              <div className="flex gap-2"><dt className="w-28 text-slate-500">Technician:</dt><dd className="font-medium text-slate-900">{techName}</dd></div>
              <div className="flex gap-2">
                <dt className="w-28 text-slate-500">Completed:</dt>
                <dd className="font-medium text-slate-900">{fmtDate(inspection.completedAt, { month: "short", day: "numeric", year: "numeric" })} {fmtTime(inspection.completedAt)}</dd>
              </div>
              <div className="flex gap-2"><dt className="w-28 text-slate-500">Complaint:</dt><dd className="font-medium text-slate-900">{job.complaint}</dd></div>
            </dl>
          </div>
        </div>

        <div className="px-5 pb-2 sm:px-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-950">Summary</h3>
            <SolidChip light={overall} label={overall === "red" ? "Action needed" : overall === "yellow" ? "Plan repairs" : overall === "green" ? "All good" : "In progress"} />
          </div>
          <ul className="mt-3 divide-y divide-slate-100">
            {SUMMARY_ORDER.map((sec) => {
              const chip = sectionChip(inspection, sec, s);
              return (
                <li key={sec} className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1 py-3 sm:grid-cols-[auto_140px_130px_1fr]">
                  <ShopIcon name={sec} className="size-7 text-slate-700" />
                  <span className="font-semibold text-slate-900">{SECTION_LABEL[sec]}</span>
                  <span className="col-start-2 sm:col-start-auto">
                    <SolidChip light={chip.light} label={chip.label} />
                  </span>
                  <span className="col-start-2 text-sm text-slate-600 sm:col-start-auto">{sectionNote(inspection, sec)}</span>
                </li>
              );
            })}
          </ul>
        </div>

        {media.length > 0 && (
          <div className="border-t border-slate-100 px-5 py-4 sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{media.length} photos &amp; videos attached</p>
            <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
              {media.map((m) => (
                <div key={m.id} className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-slate-900" title={`${MEDIA_SECTION_LABEL[m.section]}: ${m.caption}`}>
                  <img src={m.type === "video" ? m.poster ?? "" : m.url} alt={m.caption} className="h-full w-full object-cover" />
                  {m.type === "video" && (
                    <span className="absolute inset-0 grid place-items-center bg-black/25">
                      <Play className="size-5 fill-white text-white" />
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-3 border-t border-slate-100 bg-slate-50/60 p-5 sm:grid-cols-2 sm:p-6">
          <button
            type="button"
            onClick={() => setSending(true)}
            className="flex h-13 items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-base font-bold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700"
          >
            <MessageSquare className="size-5" /> {report?.sentAt ? "Send Again" : "Send to Customer"}
          </button>
          <button
            type="button"
            onClick={() => {
              const id = createEstimate(job.id);
              router.push(`/estimates/${id}`);
            }}
            className="flex h-13 items-center justify-center gap-2 rounded-xl bg-white py-3.5 text-base font-bold text-blue-700 ring-2 ring-blue-600 transition hover:bg-blue-50"
          >
            <Receipt className="size-5" /> {estimate ? "Open Estimate" : "Create Estimate"}
          </button>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        {report && (
          <Link href={`/r/${report.code}`} target="_blank" className="flex items-center gap-3 rounded-2xl bg-white p-4 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md">
            <ExternalLink className="size-5 text-blue-600" /> Customer report (phone view)
          </Link>
        )}
        <Link href={`/inspections/${job.id}/sheet`} className="flex items-center gap-3 rounded-2xl bg-white p-4 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md">
          <FileText className="size-5 text-blue-600" /> Full report (filled-out sheet)
        </Link>
        <Link href={`/inspections/${job.id}`} className="flex items-center gap-3 rounded-2xl bg-white p-4 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md">
          <Pencil className="size-5 text-blue-600" /> Edit inspection
        </Link>
      </div>

      {sending && (
        <SendReportModal
          bundle={b}
          onClose={() => setSending(false)}
          onSent={() => showToast(`Report texted to ${customer.name}.`)}
        />
      )}
      <Toast toast={toast} />
    </div>
  );
}
