"use client";

import { useState } from "react";
import { AlertTriangle, History, Lightbulb, TrendingDown, TrendingUp } from "lucide-react";
import { Card, LightDot } from "./ui";
import type { Inspection, ShopState } from "@/lib/data";
import { CORNERS, SECTION_LABEL, SUMMARY_ORDER } from "@/lib/data";
import { byId, overallLight, sectionChip } from "@/lib/utils";

export const NOTE_TEMPLATES: Record<string, string[]> = {
  tires: ["Even wear, good condition.", "Front tires wearing outer edge.", "Cupping — rotate + check balance.", "Sidewall cracking — plan replacement."],
  brakes: ["Pads wearing evenly.", "Front pads low — recommend now.", "Rotor surface worn / scored.", "Squeal on stop — inspect hardware."],
  suspension: ["No play found.", "Outer tie rod play.", "Struts leaking — plan replacement.", "Clunk over bumps."],
  alignment: ["Within spec.", "Pulls right — align.", "Steering wheel off-center.", "Outer tire wear — align with tires."],
  tpms: ["No issues.", "Light on — 1 sensor dead.", "Relearned all sensors.", "Low spare — aired up."],
};

export function PreviousCompare({ state, vehicleId, currentJobId }: { state: ShopState; vehicleId: string; currentJobId: string }) {
  const jobs = state.jobs.filter((j) => j.vehicleId === vehicleId && j.id !== currentJobId).sort((a, b) => b.date.localeCompare(a.date));
  const prev = jobs.map((j) => state.inspections.find((i) => i.jobId === j.id && i.completedAt)).find(Boolean);
  const curr = state.inspections.find((i) => i.jobId === currentJobId);
  if (!prev) {
    return (
      <Card className="p-4">
        <p className="flex items-center gap-2 text-sm font-bold text-slate-900"><History className="size-4 text-slate-400" /> First inspection for this vehicle</p>
        <p className="mt-1 text-xs text-slate-500">No previous measurements to compare. After you complete this one, the next visit will show tread & pad wear trends here.</p>
      </Card>
    );
  }
  const deltas = CORNERS.map((c) => {
    const a = prev.tires[c].tread;
    const b = curr?.tires[c].tread;
    const d = a !== null && a !== undefined && b !== null && b !== undefined ? b - a : null;
    return { c, a, b, d };
  });
  return (
    <Card className="p-4">
      <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
        <History className="size-4 text-blue-600" /> vs last visit · {prev.jobId}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {deltas.map(({ c, a, b, d }) => (
          <div key={c} className="rounded-xl bg-slate-50 p-2.5 text-center ring-1 ring-slate-100">
            <p className="text-[11px] font-black text-slate-500">{c}</p>
            <p className="text-sm font-bold text-slate-900">{b ?? "—"}<span className="text-xs font-normal text-slate-400">/32</span></p>
            <p className="text-[11px] text-slate-500">was {a ?? "—"}</p>
            {d !== null && d !== 0 && (
              <p className={`flex items-center justify-center gap-0.5 text-[11px] font-bold ${d < 0 ? "text-amber-600" : "text-emerald-600"}`}>
                {d < 0 ? <TrendingDown className="size-3" /> : <TrendingUp className="size-3" />} {d > 0 ? "+" : ""}{d}/32
              </p>
            )}
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-slate-500">Front pads: {prev.brakes.front.pad ?? "—"} → {curr?.brakes.front.pad ?? "—"} mm · Rear: {prev.brakes.rear.pad ?? "—"} → {curr?.brakes.rear.pad ?? "—"} mm</p>
    </Card>
  );
}

export function ValidationWarnings({ ins, techName }: { ins: Inspection; techName: string }) {
  const warnings: string[] = [];
  const treads = CORNERS.map((c) => ins.tires[c].tread).filter((v): v is number => v !== null);
  if (treads.length > 0 && treads.length < 4) warnings.push(`Only ${treads.length}/4 treads measured — customers trust complete sets.`);
  if (ins.tires.LF.tread !== null && ins.tires.RF.tread !== null && Math.abs(ins.tires.LF.tread - ins.tires.RF.tread) >= 3)
    warnings.push("Front treads differ by 3+/32 — double-check for a missed measurement or uneven wear worth photographing.");
  if (ins.brakes.front.pad !== null && ins.brakes.front.pad <= 3 && !ins.brakes.front.rotor)
    warnings.push("Front pads ≤3mm but no rotor grade — pick Good / Worn / Replace.");
  if (!techName) warnings.push("No technician selected on the Repairs step — pick who did the work.");
  const unchecked = SUMMARY_ORDER.filter((sec) => sectionChip(ins, sec, { treadSoon: 5, treadReplace: 3, padSoon: 5, padReplace: 3 } as never).light === "none");
  if (unchecked.length > 0 && unchecked.length < 5)
    warnings.push(`Not checked yet: ${unchecked.map((s) => SECTION_LABEL[s]).join(", ")}.`);
  if (warnings.length === 0) return null;
  return (
    <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
      <p className="flex items-center gap-2 text-sm font-bold text-amber-900"><AlertTriangle className="size-4" /> Before you complete ({warnings.length})</p>
      <ul className="mt-2 space-y-1.5">
        {warnings.map((w, i) => (
          <li key={i} className="flex items-start gap-2 text-[13px] text-amber-900"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-500" />{w}</li>
        ))}
      </ul>
    </div>
  );
}

export function OverallPreview({ ins, state }: { ins: Inspection; state: ShopState }) {
  const overall = overallLight(ins, state.settings);
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
      <span className="text-xs font-bold text-slate-500">CUSTOMER WILL SEE:</span>
      {SUMMARY_ORDER.map((sec) => {
        const chip = sectionChip(ins, sec, state.settings);
        return (
          <span key={sec} className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-semibold ring-1 ring-slate-200">
            <LightDot light={chip.light} className="size-2" /> {SECTION_LABEL[sec]}: {chip.label}
          </span>
        );
      })}
      <span className="ml-auto text-xs text-slate-400">Overall: {overall}</span>
    </div>
  );
}

export function TemplateChips({ section, onPick }: { section: string; onPick: (text: string) => void }) {
  const [used, setUsed] = useState<string | null>(null);
  const list = NOTE_TEMPLATES[section] ?? [];
  if (!list.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {list.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => {
            onPick(t);
            setUsed(t);
            setTimeout(() => setUsed(null), 1200);
          }}
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 transition ${used === t ? "bg-emerald-600 text-white ring-emerald-600" : "bg-slate-50 text-slate-600 ring-slate-200 hover:bg-slate-950 hover:text-white"}`}
        >
          {used === t ? "✓ Added" : `+ ${t.slice(0, 32)}${t.length > 32 ? "…" : ""}`}
        </button>
      ))}
    </div>
  );
}

export function InspectionCoachMarks() {
  return (
    <div className="rounded-2xl bg-blue-50 p-4 ring-1 ring-blue-100">
      <p className="flex items-center gap-2 text-sm font-bold text-blue-900"><Lightbulb className="size-4" /> New to inspections? 3 rules</p>
      <ol className="mt-2 space-y-1 text-[13px] text-blue-900">
        <li><b>1. Numbers first.</b> Tread in /32, pads in mm — colors pick themselves.</li>
        <li><b>2. Photo the yellow & red.</b> Every camera button files proof to that corner.</li>
        <li><b>3. Repairs step = what the customer sees.</b> Check the preview before Complete.</li>
      </ol>
    </div>
  );
}

export function customerName(state: ShopState, jobId: string) {
  const j = byId(state.jobs, jobId);
  return j ? byId(state.customers, j.customerId)?.name ?? "" : "";
}
