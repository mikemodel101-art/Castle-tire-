"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, Copy, ExternalLink, FileText, MessageSquare, Search, Send, Timer } from "lucide-react";
import { ShopIcon } from "@/components/brand";
import { Funnel } from "@/components/analytics";
import { SendReportModal } from "@/components/send-report-modal";
import { Toast, useToast } from "@/components/toast";
import { Card, EmptyState, LightDot, PageHeader, PlateBadge } from "@/components/ui";
import { HelpTip } from "@/components/onboarding";
import { SECTION_LABEL, SUMMARY_ORDER } from "@/lib/data";
import { useShop } from "@/lib/store";
import { reportAnalytics } from "@/lib/insights";
import { jobBundle, relStamp, sectionChip, vehicleLabel, vehiclePhoto, type JobBundle } from "@/lib/utils";

export default function ReportsPage() {
  const state = useShop();
  const [filter, setFilter] = useState<"all" | "ready" | "sent">("all");
  const [query, setQuery] = useState("");
  const [tech, setTech] = useState("all");
  const [sending, setSending] = useState<JobBundle | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [toast, showToast] = useToast();
  const s = state.settings;
  const analytics = reportAnalytics(state);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...state.reports]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .filter((r) => (filter === "ready" ? !r.sentAt : filter === "sent" ? Boolean(r.sentAt) : true))
      .map((r) => ({ r, b: jobBundle(state, r.jobId) }))
      .filter((x): x is { r: (typeof state.reports)[number]; b: JobBundle } => Boolean(x.b && x.b.inspection))
      .filter(({ b }) => (tech === "all" ? true : b.job.assignedTo === tech))
      .filter(({ r, b }) => {
        if (!q) return true;
        return `${b.customer.name} ${vehicleLabel(b.vehicle)} ${b.vehicle.plate} ${r.code} ${b.job.id}`.toLowerCase().includes(q);
      });
  }, [state, filter, query, tech]);

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/r/${code}`);
      setCopied(code);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied(null);
    }
  }

  const approvedFromReports = state.estimates.filter((e) => e.status === "approved").length;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Customer reports"
        title={
          <span>
            Inspection reports
            <HelpTip title="Texts that sell the job">
              Each report is a public link with photos, colors and the estimate. Ready → text it → customer taps Approve. Preview before you send.
            </HelpTip>
          </span>
        }
        subtitle="Branded reports customers open from a text. Photos and videos included, no app to download."
        actions={
          sending ? undefined : (
            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
              {analytics.rate}% sent · avg {analytics.avgMins}m to send
            </span>
          )
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="anim-fade-up grid grid-cols-3 gap-3">
          <Card className="p-4">
            <p className="text-xs text-slate-500">Reports</p>
            <p className="mt-1 text-2xl font-bold text-slate-950">{state.reports.length}</p>
            <p className="text-xs text-slate-500">all time</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-slate-500">Ready to send</p>
            <p className="mt-1 text-2xl font-bold text-blue-600">{state.reports.filter((r) => !r.sentAt).length}</p>
            <p className="text-xs text-slate-500">do these first</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-slate-500">Texted</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{state.reports.filter((r) => r.sentAt).length}</p>
            <p className="flex items-center gap-1 text-xs text-slate-500"><Timer className="size-3" /> avg {analytics.avgMins}m</p>
          </Card>
        </div>
        <Card className="anim-fade-up p-4">
          <h2 className="text-sm font-bold">Report → approval</h2>
          <div className="mt-3">
            <Funnel
              steps={[
                { label: "Created", value: analytics.total, color: "#64748b" },
                { label: "Sent", value: analytics.sent, color: "#2563eb" },
                { label: "Approved", value: approvedFromReports, color: "#10b981" },
              ]}
            />
          </div>
        </Card>
      </div>

      {analytics.oldest && (
        <Card className="anim-fade-up border-l-4 border-l-amber-400 p-4">
          <p className="text-sm text-slate-700">
            <b>Oldest unsent report:</b> {analytics.oldest.jobId} · created {relStamp(analytics.oldest.createdAt, state.anchorDay)}. Send it before the customer calls you.
          </p>
        </Card>
      )}

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative w-full md:max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search customer, plate, code…" className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15" />
        </div>
        <div className="flex w-fit rounded-full bg-white p-1 ring-1 ring-slate-200">
          {(["all", "ready", "sent"] as const).map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)} className={`h-8 rounded-full px-4 text-xs font-semibold transition ${filter === f ? "bg-slate-950 text-white" : "text-slate-600"}`}>
              {f === "all" ? "All" : f === "ready" ? "Ready to send" : "Sent"}
            </button>
          ))}
        </div>
        <select value={tech} onChange={(e) => setTech(e.target.value)} aria-label="Filter by technician" className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600">
          <option value="all">All techs</option>
          {state.team.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No reports here" text="A report is created when a technician taps Complete Inspection. Try clearing filters." action={<Link href="/inspections" className="font-semibold text-blue-600">Go to inspections</Link>} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {rows.map(({ r, b }) => (
            <Card key={r.code} className={`anim-fade-up overflow-hidden ${!r.sentAt ? "ring-2 ring-blue-500/40" : ""}`}>
              <div className="flex gap-4 p-4">
                <div className="relative shrink-0">
                  <img src={vehiclePhoto(b.vehicle)} alt="" className="h-24 w-32 rounded-xl object-cover" />
                  <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white">{b.media.length} media</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate font-bold text-slate-950">{vehicleLabel(b.vehicle)}</p>
                    {r.sentAt ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800"><Check className="size-3" /> Sent</span>
                    ) : (
                      <span className="shrink-0 animate-pulse rounded-md bg-blue-600 px-2 py-0.5 text-[11px] font-bold text-white">READY</span>
                    )}
                  </div>
                  <p className="truncate text-sm text-slate-600">{b.customer.name} · {b.customer.phone}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <PlateBadge plate={b.vehicle.plate} />
                    <span className="font-mono text-[11px] text-slate-400">/r/{r.code}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {r.sentAt ? `Texted ${relStamp(r.sentAt, state.anchorDay)}` : `Created ${relStamp(r.createdAt, state.anchorDay)} — send me!`}
                    {b.tech ? ` · ${b.tech.name.split(" ")[0]}` : ""}
                    {b.estimate ? ` · est. ${b.estimate.status}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 px-4">
                {b.inspection &&
                  SUMMARY_ORDER.map((sec) => {
                    const chip = sectionChip(b.inspection!, sec, s);
                    return (
                      <span key={sec} title={chip.label} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1 text-xs text-slate-700 ring-1 ring-slate-200">
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

      {sending && <SendReportModal bundle={sending} onClose={() => setSending(null)} onSent={() => showToast(`Report texted to ${sending.customer.name}.`)} />}
      <Toast toast={toast} />
    </div>
  );
}
