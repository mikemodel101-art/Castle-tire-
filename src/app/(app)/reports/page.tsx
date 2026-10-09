"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Copy, ExternalLink, FileText, MessageSquare, Send } from "lucide-react";
import { ShopIcon } from "@/components/brand";
import { SendReportModal } from "@/components/send-report-modal";
import { Toast, useToast } from "@/components/toast";
import { Card, EmptyState, InfoPanel, LightDot, OnboardingBanner, PageHeader, PlateBadge } from "@/components/ui";
import { APP_JOURNEY } from "@/lib/help";
import { SECTION_LABEL, SUMMARY_ORDER } from "@/lib/data";
import { useShop } from "@/lib/store";
import { jobBundle, relStamp, sectionChip, vehicleLabel, vehiclePhoto, type JobBundle } from "@/lib/utils";

export default function ReportsPage() {
  const state = useShop();
  const [filter, setFilter] = useState<"all" | "ready" | "sent">("all");
  const [sending, setSending] = useState<JobBundle | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [toast, showToast] = useToast();
  const s = state.settings;

  const rows = [...state.reports]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .filter((r) => (filter === "ready" ? !r.sentAt : filter === "sent" ? Boolean(r.sentAt) : true))
    .map((r) => ({ r, b: jobBundle(state, r.jobId) }))
    .filter((x): x is { r: (typeof state.reports)[number]; b: JobBundle } => Boolean(x.b && x.b.inspection));

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/r/${code}`);
      setCopied(code);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied(null);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Customer reports"
        title="Inspection reports"
        subtitle="Branded reports customers open from a text. Photos and videos included, no app to download."
      />

      <OnboardingBanner
        title="Reports are the customer-facing finish line"
        text="This page is where the shop turns the technician's work into a polished digital report. Preview, copy, send and resend from here."
        points={[APP_JOURNEY[3].title, APP_JOURNEY[4].title]}
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <div className="anim-fade-up grid grid-cols-3 gap-3">
            <Card className="p-4">
              <p className="text-xs text-slate-500">Reports</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">{state.reports.length}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-slate-500">Ready to send</p>
              <p className="mt-1 text-2xl font-bold text-blue-600">{state.reports.filter((r) => !r.sentAt).length}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-slate-500">Texted</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600">{state.reports.filter((r) => r.sentAt).length}</p>
            </Card>
          </div>

          <div className="flex w-fit rounded-full bg-white p-1 ring-1 ring-slate-200">
            {(["all", "ready", "sent"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`h-8 rounded-full px-4 text-xs font-semibold transition ${filter === f ? "bg-slate-950 text-white" : "text-slate-600"}`}
              >
                {f === "all" ? "All" : f === "ready" ? "Ready to send" : "Sent"}
              </button>
            ))}
          </div>

          {rows.length === 0 ? (
            <EmptyState title="No reports here" text="A report is created when a technician taps Complete Inspection." />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {rows.map(({ r, b }) => (
                <Card key={r.code} className="anim-fade-up overflow-hidden">
                  <div className="flex gap-4 p-4">
                    <img src={vehiclePhoto(b.vehicle)} alt="" className="h-24 w-32 shrink-0 rounded-xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate font-bold text-slate-950">{vehicleLabel(b.vehicle)}</p>
                        {r.sentAt ? (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                            <Check className="size-3" /> Sent
                          </span>
                        ) : (
                          <span className="shrink-0 rounded-md bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-800">Ready</span>
                        )}
                      </div>
                      <p className="truncate text-sm text-slate-600">{b.customer.name} · {b.customer.phone}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <PlateBadge plate={b.vehicle.plate} />
                        <span className="font-mono text-[11px] text-slate-400">/r/{r.code}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {r.sentAt ? `Texted ${relStamp(r.sentAt, state.anchorDay)}` : `Created ${relStamp(r.createdAt, state.anchorDay)}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 px-4">
                    {b.inspection &&
                      SUMMARY_ORDER.map((sec) => {
                        const chip = sectionChip(b.inspection!, sec, s);
                        return (
                          <span key={sec} title={`${SECTION_LABEL[sec]}: ${chip.label}`} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1 text-xs text-slate-700 ring-1 ring-slate-200">
                            <ShopIcon name={sec} className="size-3.5 text-slate-500" />
                            <LightDot light={chip.light} className="size-2" />
                            {SECTION_LABEL[sec]}
                          </span>
                        );
                      })}
                  </div>
                  <div className="mt-4 grid grid-cols-4 gap-px border-t border-slate-100 bg-slate-100">
                    <button type="button" onClick={() => setSending(b)} className="flex flex-col items-center gap-1 bg-white py-3 text-xs font-semibold text-blue-700 hover:bg-blue-50">
                      {r.sentAt ? <MessageSquare className="size-4" /> : <Send className="size-4" />} {r.sentAt ? "Resend" : "Send"}
                    </button>
                    <Link href={`/r/${r.code}`} target="_blank" className="flex flex-col items-center gap-1 bg-white py-3 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                      <ExternalLink className="size-4" /> Preview
                    </Link>
                    <Link href={`/r/${r.code}/sheet`} target="_blank" className="flex flex-col items-center gap-1 bg-white py-3 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                      <FileText className="size-4" /> Sheet
                    </Link>
                    <button type="button" onClick={() => copy(r.code)} className="flex flex-col items-center gap-1 bg-white py-3 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                      {copied === r.code ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />} {copied === r.code ? "Copied" : "Copy link"}
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <InfoPanel
            title="What should a new user know?"
            text="If a report is Ready, it was built from a completed inspection but has not been texted yet. Once Sent, it becomes part of the customer's permanent communication history."
            tip="Preview lets the shop see exactly what the customer sees before sending it."
          />
        </div>
      </div>

      {sending && <SendReportModal bundle={sending} onClose={() => setSending(null)} onSent={() => showToast(`Report texted to ${sending.customer.name}.`)} />}
      <Toast toast={toast} />
    </div>
  );
}
