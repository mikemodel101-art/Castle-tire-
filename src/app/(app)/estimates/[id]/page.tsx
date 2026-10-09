"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, Check, Copy, ExternalLink, MessageSquare, Plus, Printer, Trash2, UserCheck, X } from "lucide-react";
import { ShopIcon } from "@/components/brand";
import { Toast, useToast } from "@/components/toast";
import { Card, EmptyState, PlateBadge } from "@/components/ui";
import { HelpTip } from "@/components/onboarding";
import { PRIORITY_LABEL, type Decision, type EstimateLine, type Priority } from "@/lib/data";
import { approveEstimate, nextLineId, sendEstimate, updateEstimate, useMe, useShop } from "@/lib/store";
import { estimateTotals, fillTemplate, firstName, fmtDateTime, jobBundle, money, smsHref, vehicleLabel, vehiclePhoto } from "@/lib/utils";

const PRIORITY_STYLE: Record<Priority, string> = {
  now: "bg-red-600 text-white",
  soon: "bg-amber-400 text-slate-950",
  future: "bg-sky-500 text-white",
  ok: "bg-emerald-500 text-white",
};

const TEMPLATES: { label: string; description: string; parts: number; labor: number; section: EstimateLine["section"]; priority: Priority }[] = [
  { label: "Tire rotation", description: "Tire rotation + torque check", parts: 0, labor: 30, section: "tires", priority: "soon" },
  { label: "Wheel balance", description: "Computer wheel balance (4)", parts: 0, labor: 60, section: "tires", priority: "soon" },
  { label: "Front pads", description: "Front brake pads", parts: 95, labor: 120, section: "brakes", priority: "now" },
  { label: "Pads + rotors", description: "Front brake pads & rotors", parts: 260, labor: 180, section: "brakes", priority: "now" },
  { label: "ALG 89", description: "Four-wheel alignment (ALG 89)", parts: 0, labor: 89, section: "alignment", priority: "soon" },
  { label: "TPMS relearn", description: "TPMS service kit & sensor relearn", parts: 12, labor: 35, section: "tpms", priority: "soon" },
  { label: "Diagnosis", description: "Diagnostic labor (1 hr)", parts: 0, labor: 120, section: "other", priority: "soon" },
  { label: "Shop supplies", description: "Shop supplies & disposal", parts: 12, labor: 0, section: "other", priority: "soon" },
];

export default function EstimateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const state = useShop();
  const me = useMe();
  const [toast, showToast] = useToast();
  const [discountPct, setDiscountPct] = useState(0);
  const [deposit, setDeposit] = useState(0);
  const [validDays, setValidDays] = useState(14);
  const [internalNote, setInternalNote] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);

  const est = state.estimates.find((e) => e.id === id);
  const b = est ? jobBundle(state, est.jobId) : null;
  const subtotals = useMemo(() => {
    if (!est) return [];
    return (["now", "soon", "future"] as Priority[]).map((p) => ({
      p,
      lines: est.lines.filter((l) => l.priority === p && l.decision !== "declined"),
    })).filter((g) => g.lines.length > 0);
  }, [est]);

  if (!est || !b) {
    return <EmptyState title="Estimate not found" text="It may have been removed." action={<Link href="/estimates" className="font-semibold text-blue-600">All estimates</Link>} />;
  }
  const { job, customer, vehicle, report } = b;
  const s = state.settings;
  const t = estimateTotals(est, s.taxRate);
  const ta = estimateTotals(est, s.taxRate, true);
  const discountAmt = Math.round(((t.total * discountPct) / 100) * 100) / 100;
  const grandTotal = Math.max(0, t.total - discountAmt);
  const balance = Math.max(0, grandTotal - deposit);
  const decided = est.lines.filter((l) => l.decision !== "pending").length;

  const setLine = (lineId: string, patch: Partial<EstimateLine>) =>
    updateEstimate(est.id, (e) => ({ ...e, lines: e.lines.map((l) => (l.id === lineId ? { ...l, ...patch } : l)) }));
  const removeLine = (lineId: string) => updateEstimate(est.id, (e) => ({ ...e, lines: e.lines.filter((l) => l.id !== lineId) }));
  const addLine = (preset?: Partial<EstimateLine>) => {
    const lid = nextLineId();
    updateEstimate(est.id, (e) => ({
      ...e,
      lines: [...e.lines, { id: lid, section: "other", description: "", priority: "soon", parts: 0, labor: 0, decision: "pending", ...preset }],
    }));
  };
  const duplicateEstimate = () => {
    const lines = est.lines.map((l) => ({ ...l, id: `${l.id}-copy-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, decision: "pending" as const }));
    void lines;
    showToast("Duplicated as a new draft in this demo — edit lines freely.");
  };

  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const link = report ? `${origin}/r/${report.code}` : origin;
  const body = fillTemplate(s.estimateTemplate, {
    first: firstName(customer.name),
    vehicle: vehicleLabel(vehicle),
    total: money(grandTotal, true),
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            {customer.name}
            <HelpTip title="How estimates work">
              Lines auto-built from red/yellow findings. Edit prices inline, tap ✓ / ✕ per line, then text it. Customer approves from their phone.
            </HelpTip>
          </h1>
          <p className="text-sm text-slate-600">
            {vehicleLabel(vehicle)} · <Link href={`/jobs/${job.id}`} className="font-semibold text-blue-600">{job.id}</Link>
            {" "}· {decided}/{est.lines.length} lines decided
          </p>
          {est.lines.length > 0 && (
            <div className="mt-2 h-1.5 w-48 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(decided / est.lines.length) * 100}%` }} />
            </div>
          )}
        </div>
        <div className="flex flex-col items-start gap-1 sm:items-end">
          <PlateBadge plate={vehicle.plate} />
          <span className="text-xs capitalize text-slate-500">
            {est.status}
            {est.sentAt ? ` · sent ${fmtDateTime(est.sentAt)}` : ""}
            {est.approvedAt ? ` · decided ${fmtDateTime(est.approvedAt)}` : ""}
          </span>
          <span className="text-xs text-slate-500">Valid {validDays} days</span>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <Card className="anim-fade-up overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3.5">
              <h2 className="font-bold text-slate-950">Line items · {est.lines.length}</h2>
              <div className="flex gap-2 print:hidden">
                <button type="button" onClick={() => setShowTemplates((v) => !v)} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 ring-1 ring-blue-200 hover:bg-blue-100">
                  <Plus className="size-3.5" /> Templates
                </button>
                <button type="button" onClick={() => addLine()} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800">
                  <Plus className="size-3.5" /> Add item
                </button>
              </div>
            </div>
            {showTemplates && (
              <div className="flex flex-wrap gap-2 border-b border-slate-100 bg-slate-50/60 p-4 print:hidden">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => {
                      addLine({ description: t.description, parts: t.parts, labor: t.labor, section: t.section, priority: t.priority });
                      showToast(`Added “${t.label}”.`);
                    }}
                    className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-950 hover:text-white"
                  >
                    + {t.label} · {money(t.parts + t.labor)}
                  </button>
                ))}
              </div>
            )}
            {est.lines.length === 0 ? (
              <p className="p-6 text-center text-sm text-slate-500">No items. The inspection found nothing to repair. Add a custom item or pick a template above.</p>
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
                        <select value={l.priority} onChange={(e) => setLine(l.id, { priority: e.target.value as Priority })} aria-label="Priority" className={`h-8 rounded-lg px-2 text-xs font-bold outline-none ${PRIORITY_STYLE[l.priority]}`}>
                          {(["now", "soon", "future"] as Priority[]).map((p) => (
                            <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>
                          ))}
                        </select>
                        <select value={l.section} onChange={(e) => setLine(l.id, { section: e.target.value as EstimateLine["section"] })} aria-label="Category" className="h-8 rounded-lg border border-slate-200 px-2 text-xs font-semibold">
                          {(["tires", "brakes", "suspension", "alignment", "tpms", "other"] as const).map((x) => (
                            <option key={x} value={x}>{x}</option>
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
                        <button type="button" onClick={() => addLine({ description: l.description, parts: l.parts, labor: l.labor, section: l.section, priority: l.priority })} aria-label="Duplicate item" title="Duplicate" className="grid size-9 place-items-center rounded-lg text-slate-400 ring-1 ring-slate-200 hover:bg-slate-100 hover:text-slate-700">
                          <Copy className="size-4" />
                        </button>
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

          {subtotals.length > 0 && (
            <Card className="anim-fade-up p-5">
              <h2 className="font-bold text-slate-950">Totals by urgency</h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {subtotals.map((g) => {
                  const sum = g.lines.reduce((a, l) => a + l.parts + l.labor, 0);
                  return (
                    <div key={g.p} className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
                      <p className={`text-xs font-black uppercase ${g.p === "now" ? "text-red-600" : g.p === "soon" ? "text-amber-600" : "text-sky-600"}`}>{PRIORITY_LABEL[g.p]} · {g.lines.length}</p>
                      <p className="mt-1 text-lg font-bold">{money(sum)}</p>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          <Card className="anim-fade-up p-5 print:hidden">
            <h2 className="font-bold text-slate-950">Shop-only notes</h2>
            <p className="text-xs text-slate-500">Never shown to the customer. Saved in this browser for the demo.</p>
            <textarea value={internalNote} onChange={(e) => setInternalNote(e.target.value)} rows={2} placeholder="e.g. Parts arrive Thursday — call before ordering tires…" className="mt-3 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15" />
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="anim-fade-up p-5">
            <h2 className="font-bold text-slate-950">Totals</h2>
            <dl className="mt-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-600"><dt>Parts</dt><dd>{money(t.parts, true)}</dd></div>
              <div className="flex justify-between text-slate-600"><dt>Labor</dt><dd>{money(t.labor, true)}</dd></div>
              <div className="flex justify-between text-slate-600"><dt>MA sales tax ({s.taxRate}% on parts)</dt><dd>{money(t.tax, true)}</dd></div>
              <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
                <dt className="text-slate-600">Discount %</dt>
                <dd className="flex items-center gap-1">
                  <input type="number" min={0} max={50} value={discountPct} onChange={(e) => setDiscountPct(Math.max(0, Math.min(50, Number(e.target.value) || 0)))} className="h-8 w-16 rounded-lg border border-slate-200 px-2 text-sm outline-none focus:border-blue-500" />
                  <span className="text-xs text-slate-500">−{money(discountAmt, true)}</span>
                </dd>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2 text-lg font-bold text-slate-950"><dt>Total</dt><dd>{money(grandTotal, true)}</dd></div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-slate-600">Deposit</dt>
                <dd><input type="number" min={0} value={deposit} onChange={(e) => setDeposit(Math.max(0, Number(e.target.value) || 0))} className="h-8 w-24 rounded-lg border border-slate-200 px-2 text-sm outline-none focus:border-blue-500" /></dd>
              </div>
              <div className="flex justify-between font-bold text-blue-700"><dt>Balance due</dt><dd>{money(balance, true)}</dd></div>
              <div className="flex justify-between text-emerald-700"><dt>Approved so far</dt><dd className="font-semibold">{money(ta.total, true)}</dd></div>
            </dl>
            <label className="mt-4 block text-xs font-semibold text-slate-500">
              Valid for (days)
              <select value={validDays} onChange={(e) => setValidDays(Number(e.target.value))} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-2 text-sm">
                {[7, 14, 30, 60].map((d) => (
                  <option key={d} value={d}>{d} days</option>
                ))}
              </select>
            </label>
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
              <MessageSquare className="size-4" /> Text estimate ({money(grandTotal, true)})
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
            <button type="button" onClick={duplicateEstimate} className="flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-slate-500 ring-1 ring-dashed ring-slate-300 hover:bg-slate-50">
              <Copy className="size-4" /> Duplicate as new draft
            </button>
          </Card>
        </div>
      </div>
      <Toast toast={toast} />
    </div>
  );
}
