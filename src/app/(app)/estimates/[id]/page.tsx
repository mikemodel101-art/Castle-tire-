"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft, Check, ExternalLink, MessageSquare, Plus, Printer, Trash2, UserCheck, X } from "lucide-react";
import { ShopIcon } from "@/components/brand";
import { Toast, useToast } from "@/components/toast";
import { Card, EmptyState, PlateBadge } from "@/components/ui";
import { PRIORITY_LABEL, type Decision, type EstimateLine, type Priority } from "@/lib/data";
import { approveEstimate, nextLineId, sendEstimate, updateEstimate, useMe, useShop } from "@/lib/store";
import { estimateTotals, fillTemplate, firstName, fmtDateTime, jobBundle, money, smsHref, vehicleLabel, vehiclePhoto } from "@/lib/utils";

const PRIORITY_STYLE: Record<Priority, string> = {
  now: "bg-red-600 text-white",
  soon: "bg-amber-400 text-slate-950",
  future: "bg-sky-500 text-white",
  ok: "bg-emerald-500 text-white",
};

export default function EstimateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const state = useShop();
  const me = useMe();
  const [toast, showToast] = useToast();

  const est = state.estimates.find((e) => e.id === id);
  const b = est ? jobBundle(state, est.jobId) : null;
  if (!est || !b) {
    return <EmptyState title="Estimate not found" text="It may have been removed." action={<Link href="/estimates" className="font-semibold text-blue-600">All estimates</Link>} />;
  }
  const { job, customer, vehicle, report } = b;
  const s = state.settings;
  const t = estimateTotals(est, s.taxRate);
  const ta = estimateTotals(est, s.taxRate, true);

  const setLine = (lineId: string, patch: Partial<EstimateLine>) =>
    updateEstimate(est.id, (e) => ({ ...e, lines: e.lines.map((l) => (l.id === lineId ? { ...l, ...patch } : l)) }));
  const removeLine = (lineId: string) => updateEstimate(est.id, (e) => ({ ...e, lines: e.lines.filter((l) => l.id !== lineId) }));
  const addLine = () => {
    const lid = nextLineId();
    updateEstimate(est.id, (e) => ({
      ...e,
      lines: [...e.lines, { id: lid, section: "other", description: "", priority: "soon", parts: 0, labor: 0, decision: "pending" }],
    }));
  };

  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const link = report ? `${origin}/r/${report.code}` : origin;
  const body = fillTemplate(s.estimateTemplate, {
    first: firstName(customer.name),
    vehicle: vehicleLabel(vehicle),
    total: money(t.total, true),
    link,
    shop: s.shopName,
  });

  const decisionBtn = (l: EstimateLine, d: Decision, label: string, icon: ReactNode, on: string) => (
    <button
      type="button"
      onClick={() => setLine(l.id, { decision: l.decision === d ? "pending" : d })}
      aria-label={label}
      title={label}
      className={`grid size-9 place-items-center rounded-lg ring-1 transition ${l.decision === d ? on : "bg-white text-slate-400 ring-slate-200 hover:text-slate-700"}`}
    >
      {icon}
    </button>
  );

  return (
    <div className="space-y-5">
      <Link href="/estimates" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 print:hidden">
        <ArrowLeft className="size-4" /> All estimates
      </Link>

      <Card className="anim-fade-up flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <img src={vehiclePhoto(vehicle)} alt="" className="h-20 w-28 shrink-0 rounded-xl object-cover" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Estimate {est.id}</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">{customer.name}</h1>
          <p className="text-sm text-slate-600">
            {vehicleLabel(vehicle)} · <Link href={`/jobs/${job.id}`} className="font-semibold text-blue-600">{job.id}</Link>
          </p>
        </div>
        <div className="flex flex-col items-start gap-1 sm:items-end">
          <PlateBadge plate={vehicle.plate} />
          <span className="text-xs capitalize text-slate-500">
            {est.status}
            {est.sentAt ? ` · sent ${fmtDateTime(est.sentAt)}` : ""}
            {est.approvedAt ? ` · decided ${fmtDateTime(est.approvedAt)}` : ""}
          </span>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <Card className="anim-fade-up overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
            <h2 className="font-bold text-slate-950">Line items</h2>
            <button type="button" onClick={addLine} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 print:hidden">
              <Plus className="size-3.5" /> Add item
            </button>
          </div>
          {est.lines.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-500">No items. The inspection found nothing to repair. Add a custom item if needed.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {est.lines.map((l) => (
                <li key={l.id} className={`grid gap-3 p-4 sm:grid-cols-[1fr_auto] ${l.decision === "declined" ? "bg-slate-50/80 opacity-70" : ""}`}>
                  <div className="min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      {l.section !== "other" && <ShopIcon name={l.section} className="size-5 shrink-0 text-slate-500" />}
                      <input
                        value={l.description}
                        onChange={(e) => setLine(l.id, { description: e.target.value })}
                        placeholder="Describe the repair"
                        aria-label="Description"
                        className={`h-10 min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 text-sm font-semibold text-slate-900 outline-none hover:border-slate-200 focus:border-blue-500 focus:bg-white ${l.decision === "declined" ? "line-through" : ""}`}
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={l.priority}
                        onChange={(e) => setLine(l.id, { priority: e.target.value as Priority })}
                        aria-label="Priority"
                        className={`h-8 rounded-lg px-2 text-xs font-bold outline-none ${PRIORITY_STYLE[l.priority]}`}
                      >
                        {(["now", "soon", "future"] as Priority[]).map((p) => (
                          <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>
                        ))}
                      </select>
                      <label className="flex items-center gap-1 text-xs text-slate-500">
                        Parts $
                        <input type="number" min={0} value={l.parts} onChange={(e) => setLine(l.id, { parts: Number(e.target.value) || 0 })} className="h-8 w-20 rounded-lg border border-slate-200 px-2 text-sm text-slate-900 outline-none focus:border-blue-500" />
                      </label>
                      <label className="flex items-center gap-1 text-xs text-slate-500">
                        Labor $
                        <input type="number" min={0} value={l.labor} onChange={(e) => setLine(l.id, { labor: Number(e.target.value) || 0 })} className="h-8 w-20 rounded-lg border border-slate-200 px-2 text-sm text-slate-900 outline-none focus:border-blue-500" />
                      </label>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-end">
                    <span className="text-base font-bold text-slate-950">{money(l.parts + l.labor)}</span>
                    <div className="flex gap-1.5 print:hidden">
                      {decisionBtn(l, "approved", "Approve", <Check className="size-4" />, "bg-emerald-600 text-white ring-emerald-600")}
                      {decisionBtn(l, "declined", "Decline", <X className="size-4" />, "bg-red-600 text-white ring-red-600")}
                      <button type="button" onClick={() => removeLine(l.id)} aria-label="Remove item" className="grid size-9 place-items-center rounded-lg text-slate-400 ring-1 ring-slate-200 hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-5">
          <Card className="anim-fade-up p-5">
            <h2 className="font-bold text-slate-950">Totals</h2>
            <dl className="mt-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-600"><dt>Parts</dt><dd>{money(t.parts, true)}</dd></div>
              <div className="flex justify-between text-slate-600"><dt>Labor</dt><dd>{money(t.labor, true)}</dd></div>
              <div className="flex justify-between text-slate-600"><dt>MA sales tax ({s.taxRate}% on parts)</dt><dd>{money(t.tax, true)}</dd></div>
              <div className="flex justify-between border-t border-slate-100 pt-2 text-lg font-bold text-slate-950"><dt>Total</dt><dd>{money(t.total, true)}</dd></div>
              <div className="flex justify-between text-emerald-700"><dt>Approved so far</dt><dd className="font-semibold">{money(ta.total, true)}</dd></div>
            </dl>
          </Card>

          <Card className="anim-fade-up space-y-3 p-5 print:hidden">
            <h2 className="font-bold text-slate-950">Send to customer</h2>
            <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700 ring-1 ring-slate-200">{body}</p>
            <a
              href={smsHref(customer.phone, body)}
              onClick={() => {
                sendEstimate(est.id, body, me.id);
                showToast(`Estimate texted to ${customer.name}.`);
              }}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <MessageSquare className="size-4" /> Text estimate
            </a>
            <button
              type="button"
              onClick={() => {
                approveEstimate(est.id, me.id);
                showToast("Customer approval recorded. Job moved to Approved.");
              }}
              disabled={est.status === "approved"}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <UserCheck className="size-4" /> {est.status === "approved" ? "Approved" : "Customer approved (by phone)"}
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => window.print()} className="flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
                <Printer className="size-4" /> Print
              </button>
              {report && (
                <Link href={`/r/${report.code}`} target="_blank" className="flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
                  <ExternalLink className="size-4" /> Customer view
                </Link>
              )}
            </div>
          </Card>
        </div>
      </div>
      <Toast toast={toast} />
    </div>
  );
}
