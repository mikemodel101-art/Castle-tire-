"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Camera, CheckCircle2, Plus, Save, Trash2 } from "lucide-react";
import { Card, StatusBadge, StatusDot } from "@/components/ui";
import {
  CATEGORY_LABEL,
  type Category,
  type CheckStatus,
  type Inspection,
  type Member,
  type Measure,
  type Recommendation,
  type Status,
  type TireReading,
  type BrakeReading,
  type TpmsReading,
  type SuspensionCheck,
} from "@/lib/data";
import {
  padStatus,
  rangeStatus,
  rotorStatus,
  sectionStatuses,
  statusMeta,
  tireStatus,
  tpmsStatus,
} from "@/lib/utils";

export type InspectionJobInfo = {
  id: string;
  service: string;
  time: string;
  date: string;
  customerName: string;
  customerPhone: string;
  vehicleLabel: string;
  plate: string;
  mileage: number;
};

const inputCls =
  "h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/15";

const SUSPENSION_OPTIONS: { value: CheckStatus; label: string; cls: string }[] = [
  { value: "pending", label: "Not checked", cls: "bg-slate-100 text-slate-600" },
  { value: "green", label: "Pass", cls: "bg-emerald-50 text-emerald-700" },
  { value: "yellow", label: "Monitor", cls: "bg-amber-50 text-amber-800" },
  { value: "red", label: "Repair", cls: "bg-rose-50 text-rose-700" },
];

const numOrNull = (v: string) => (v.trim() === "" ? null : Number(v));

export function InspectionForm({
  job,
  initial,
  team,
  mediaCounts,
}: {
  job: InspectionJobInfo;
  initial: Inspection;
  team: Member[];
  mediaCounts: Record<Category, number>;
}) {
  const [ins, setIns] = useState<Inspection>(initial);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const s = sectionStatuses(ins);

  const setTire = (i: number, patch: Partial<TireReading>) =>
    setIns((p) => ({ ...p, tires: p.tires.map((t, idx) => (idx === i ? { ...t, ...patch } : t)) }));
  const setBrake = (i: number, patch: Partial<BrakeReading>) =>
    setIns((p) => ({ ...p, brakes: p.brakes.map((b, idx) => (idx === i ? { ...b, ...patch } : b)) }));
  const setTpms = (i: number, patch: Partial<TpmsReading>) =>
    setIns((p) => ({ ...p, tpms: p.tpms.map((t, idx) => (idx === i ? { ...t, ...patch } : t)) }));
  const setSusp = (i: number, patch: Partial<SuspensionCheck>) =>
    setIns((p) => ({ ...p, suspension: p.suspension.map((t, idx) => (idx === i ? { ...t, ...patch } : t)) }));
  const setAlign = (k: "caster" | "camber" | "toe", patch: Partial<Measure>) =>
    setIns((p) => ({ ...p, alignment: { ...p.alignment, [k]: { ...p.alignment[k], ...patch } } }));
  const setRec = (i: number, patch: Partial<Recommendation>) =>
    setIns((p) => ({ ...p, recommendations: p.recommendations.map((r, idx) => (idx === i ? { ...r, ...patch } : r)) }));
  const addRec = () =>
    setIns((p) => ({
      ...p,
      recommendations: [
        ...p.recommendations,
        { id: `r-${Date.now()}`, text: "", severity: "yellow", estimate: 0, category: "tires" },
      ],
    }));
  const removeRec = (i: number) =>
    setIns((p) => ({ ...p, recommendations: p.recommendations.filter((_, idx) => idx !== i) }));

  const totalEstimate = ins.recommendations.reduce((sum, r) => sum + (Number(r.estimate) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Sticky traffic-light summary */}
      <div className="sticky top-3 z-20 flex flex-wrap items-center gap-2 rounded-2xl bg-white/90 p-3 shadow-sm ring-1 ring-slate-200 backdrop-blur md:top-4">
        <span className="mr-1 text-sm font-semibold text-slate-900">Status</span>
        <StatusBadge status={s.overall} />
        <div className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />
        {[
          ["Tires", s.tires],
          ["Brakes", s.brakes],
          ["TPMS", s.tpms],
          ["Suspension", s.suspension],
          ["Alignment", s.alignment],
        ].map(([label, st]) => (
          <span key={label as string} className="flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
            <StatusDot status={st as CheckStatus} />
            {label as string}
          </span>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setToast("Draft saved. (Demo: changes stay in this browser session.)")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-50"
          >
            <Save className="size-3.5" /> Save draft
          </button>
          <button
            onClick={() => setToast("Inspection complete. Report is ready to send from Reports.")}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
          >
            <CheckCircle2 className="size-3.5" /> Complete
          </button>
        </div>
      </div>

      {/* 1. Tires */}
      <Section
        index={1}
        title="Tires & tread depth"
        subtitle="Tread in 32nds of an inch. 6+ pass · 4–5 monitor · under 4 replace."
        status={s.tires}
        category="tires"
        count={mediaCounts.tires}
        jobId={job.id}
      >
        <div className="hidden grid-cols-[64px_1.4fr_1fr_110px_100px_120px] gap-3 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:grid">
          <span>Pos</span><span>Brand</span><span>Size</span><span>Tread 32nds</span><span>PSI</span><span>Status</span>
        </div>
        {ins.tires.map((t, i) => (
          <div key={t.position} className="grid grid-cols-2 items-center gap-3 rounded-xl bg-slate-50/70 p-3 ring-1 ring-slate-100 sm:grid-cols-[64px_1.4fr_1fr_110px_100px_120px] sm:p-2.5">
            <span className="font-bold text-slate-950">{t.position}</span>
            <input className={inputCls} placeholder="Brand" value={t.brand} onChange={(e) => setTire(i, { brand: e.target.value })} aria-label={`${t.position} brand`} />
            <input className={inputCls} placeholder="Size" value={t.size} onChange={(e) => setTire(i, { size: e.target.value })} aria-label={`${t.position} size`} />
            <input className={inputCls} type="number" inputMode="decimal" step="0.5" min={0} max={16} placeholder="Tread" value={t.treadDepth ?? ""} onChange={(e) => setTire(i, { treadDepth: numOrNull(e.target.value) })} aria-label={`${t.position} tread depth`} />
            <input className={inputCls} type="number" inputMode="numeric" min={0} max={80} placeholder="PSI" value={t.psi ?? ""} onChange={(e) => setTire(i, { psi: numOrNull(e.target.value) })} aria-label={`${t.position} PSI`} />
            <div className="flex sm:justify-end"><StatusBadge status={tireStatus(t.treadDepth)} /></div>
          </div>
        ))}
      </Section>

      {/* 2. Brakes */}
      <Section
        index={2}
        title="Brakes"
        subtitle="Pad thickness in mm (6+ pass, 3–5.9 monitor, under 3 replace). Rotor vs. minimum spec."
        status={s.brakes}
        category="brakes"
        count={mediaCounts.brakes}
        jobId={job.id}
      >
        <div className="hidden grid-cols-[150px_1fr_1fr_1fr_120px] gap-3 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:grid">
          <span>Position</span><span>Pad mm</span><span>Rotor mm</span><span>Min spec mm</span><span>Status</span>
        </div>
        {ins.brakes.map((b, i) => {
          const st = [padStatus(b.padMm), rotorStatus(b.rotorMm, b.rotorMinMm)];
          const overallRow: CheckStatus = st.includes("red") ? "red" : st.includes("yellow") ? "yellow" : st[0] === "pending" ? "pending" : "green";
          return (
            <div key={b.position} className="grid grid-cols-2 items-center gap-3 rounded-xl bg-slate-50/70 p-3 ring-1 ring-slate-100 sm:grid-cols-[150px_1fr_1fr_1fr_120px] sm:p-2.5">
              <span className="font-semibold text-slate-900">{b.position}</span>
              <input className={inputCls} type="number" step="0.1" min={0} placeholder="Pad mm" value={b.padMm ?? ""} onChange={(e) => setBrake(i, { padMm: numOrNull(e.target.value) })} aria-label={`${b.position} pad thickness`} />
              <input className={inputCls} type="number" step="0.1" min={0} placeholder="Rotor mm" value={b.rotorMm ?? ""} onChange={(e) => setBrake(i, { rotorMm: numOrNull(e.target.value) })} aria-label={`${b.position} rotor thickness`} />
              <input className={inputCls} type="number" step="0.1" min={0} placeholder="Min mm" value={b.rotorMinMm} onChange={(e) => setBrake(i, { rotorMinMm: Number(e.target.value) || 0 })} aria-label={`${b.position} minimum rotor spec`} />
              <div className="flex sm:justify-end"><StatusBadge status={overallRow} /></div>
            </div>
          );
        })}
      </Section>

      {/* 3. TPMS */}
      <Section
        index={3}
        title="Tire pressure (TPMS)"
        subtitle="Target 35 PSI. Within 2 pass, within 5 monitor. A sensor fault is always Repair."
        status={s.tpms}
        category="tpms"
        count={mediaCounts.tpms}
        jobId={job.id}
      >
        <div className="hidden grid-cols-[64px_1fr_1fr_120px] gap-3 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:grid">
          <span>Pos</span><span>PSI</span><span>Sensor</span><span>Status</span>
        </div>
        {ins.tpms.map((t, i) => (
          <div key={t.position} className="grid grid-cols-2 items-center gap-3 rounded-xl bg-slate-50/70 p-3 ring-1 ring-slate-100 sm:grid-cols-[64px_1fr_1fr_120px] sm:p-2.5">
            <span className="font-bold text-slate-950">{t.position}</span>
            <input className={inputCls} type="number" min={0} max={80} placeholder="PSI" value={t.psi ?? ""} onChange={(e) => setTpms(i, { psi: numOrNull(e.target.value) })} aria-label={`${t.position} TPMS pressure`} />
            <select className={inputCls} value={t.sensorOk ? "ok" : "fault"} onChange={(e) => setTpms(i, { sensorOk: e.target.value === "ok" })} aria-label={`${t.position} sensor`}>
              <option value="ok">Sensor OK</option>
              <option value="fault">Sensor fault</option>
            </select>
            <div className="flex sm:justify-end"><StatusBadge status={tpmsStatus(t.psi, t.sensorOk)} /></div>
          </div>
        ))}
      </Section>

      {/* 4. Suspension */}
      <Section
        index={4}
        title="Suspension & steering"
        subtitle="Mark each component. Add a short note for anything not passing."
        status={s.suspension}
        category="suspension"
        count={mediaCounts.suspension}
        jobId={job.id}
      >
        {ins.suspension.map((c, i) => {
          const opt = SUSPENSION_OPTIONS.find((o) => o.value === c.status) ?? SUSPENSION_OPTIONS[0];
          return (
            <div key={c.item} className="grid gap-3 rounded-xl bg-slate-50/70 p-3 ring-1 ring-slate-100 sm:grid-cols-[200px_170px_1fr] sm:items-center sm:p-2.5">
              <span className="flex items-center gap-2 font-semibold text-slate-900">
                <StatusDot status={c.status} />
                {c.item}
              </span>
              <select
                className={`${inputCls} font-medium ${opt.cls}`}
                value={c.status}
                onChange={(e) => setSusp(i, { status: e.target.value as CheckStatus })}
                aria-label={`${c.item} status`}
              >
                {SUSPENSION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <input className={inputCls} placeholder="Technician note" value={c.note} onChange={(e) => setSusp(i, { note: e.target.value })} aria-label={`${c.item} note`} />
            </div>
          );
        })}
      </Section>

      {/* 5. Alignment */}
      <Section
        index={5}
        title="Wheel alignment"
        subtitle="As-found readings in degrees. Enter the spec range from the manufacturer."
        status={s.alignment}
        category="alignment"
        count={mediaCounts.alignment}
        jobId={job.id}
      >
        <div className="hidden grid-cols-[160px_1fr_1fr_1fr_120px] gap-3 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:grid">
          <span>Measure</span><span>As found (°)</span><span>Spec min</span><span>Spec max</span><span>Status</span>
        </div>
        {(["caster", "camber", "toe"] as const).map((k) => {
          const m = ins.alignment[k];
          return (
            <div key={k} className="grid grid-cols-2 items-center gap-3 rounded-xl bg-slate-50/70 p-3 ring-1 ring-slate-100 sm:grid-cols-[160px_1fr_1fr_1fr_120px] sm:p-2.5">
              <span className="font-semibold capitalize text-slate-900">{k}</span>
              <input className={inputCls} type="number" step="0.05" placeholder="Value" value={m.value ?? ""} onChange={(e) => setAlign(k, { value: numOrNull(e.target.value) })} aria-label={`${k} reading`} />
              <input className={inputCls} type="number" step="0.05" placeholder="Min" value={m.min} onChange={(e) => setAlign(k, { min: Number(e.target.value) })} aria-label={`${k} spec minimum`} />
              <input className={inputCls} type="number" step="0.05" placeholder="Max" value={m.max} onChange={(e) => setAlign(k, { max: Number(e.target.value) })} aria-label={`${k} spec maximum`} />
              <div className="flex sm:justify-end"><StatusBadge status={rangeStatus(m.value, m.min, m.max)} /></div>
            </div>
          );
        })}
      </Section>

      {/* 6. Notes */}
      <Card className="anim-fade-up p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-950">6 · Technician notes</h2>
            <p className="text-sm text-slate-500">Plain-language findings the customer will see on the report.</p>
          </div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Inspected by
            <select
              className={`${inputCls} mt-1.5 min-w-56 font-normal normal-case tracking-normal`}
              value={ins.technicianId ?? ""}
              onChange={(e) => setIns((p) => ({ ...p, technicianId: e.target.value || null }))}
            >
              <option value="">Select technician</option>
              {team.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </label>
        </div>
        <textarea
          className="mt-4 min-h-28 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/15"
          placeholder="Example: Rear-left tire is down to 3/32 in. Recommend replacing in pairs…"
          value={ins.notes}
          onChange={(e) => setIns((p) => ({ ...p, notes: e.target.value }))}
        />
      </Card>

      {/* 7. Recommendations */}
      <Card className="anim-fade-up p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-slate-950">7 · Repair recommendations</h2>
            <p className="text-sm text-slate-500">Severity drives the colour on the customer report.</p>
          </div>
          <button onClick={addRec} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
            <Plus className="size-4" /> Add item
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {ins.recommendations.length === 0 && (
            <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
              No recommendations yet. Add one for each repair or monitor item.
            </p>
          )}
          {ins.recommendations.map((r, i) => {
            const meta = statusMeta(r.severity);
            return (
              <div key={r.id} className="grid grid-cols-[1fr_auto] gap-3 rounded-xl bg-slate-50/70 p-3 ring-1 ring-slate-100 sm:grid-cols-[minmax(0,1fr)_150px_120px_auto] sm:items-center">
                <input className={`${inputCls} col-span-2 sm:col-span-1`} placeholder="Describe the repair" value={r.text} onChange={(e) => setRec(i, { text: e.target.value })} aria-label="Recommendation" />
                <select className={`${inputCls} font-medium`} value={r.severity} onChange={(e) => setRec(i, { severity: e.target.value as Status })} aria-label="Severity">
                  <option value="red">Repair now</option>
                  <option value="yellow">Monitor / soon</option>
                  <option value="green">Optional</option>
                </select>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                  <input className={`${inputCls} pl-7`} type="number" min={0} placeholder="0" value={r.estimate} onChange={(e) => setRec(i, { estimate: Number(e.target.value) || 0 })} aria-label="Estimate" />
                </div>
                <button onClick={() => removeRec(i)} aria-label="Remove recommendation" className="grid size-10 place-items-center justify-self-end rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600">
                  <Trash2 className="size-4" />
                </button>
                <span className="sr-only">{meta.label}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
          <span className="text-sm text-slate-600">Estimated total</span>
          <span className="text-xl font-bold text-slate-950">${totalEstimate.toLocaleString("en-US")}</span>
        </div>
      </Card>

      {toast && (
        <div className="anim-fade-up fixed bottom-24 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm text-white shadow-2xl md:bottom-8">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
          <span>{toast}</span>
          <Link href="/reports" className="ml-auto whitespace-nowrap font-semibold text-amber-300">Reports →</Link>
        </div>
      )}
    </div>
  );
}

function Section({
  index,
  title,
  subtitle,
  status,
  category,
  count,
  jobId,
  children,
}: {
  index: number;
  title: string;
  subtitle: string;
  status: CheckStatus;
  category: Category;
  count: number;
  jobId: string;
  children: ReactNode;
}) {
  return (
    <Card className="anim-fade-up p-5 sm:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-semibold text-slate-950">
            {index} · {title}
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatusBadge status={status} />
          <Link
            href={`/media?job=${jobId}&category=${category}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50/60"
            aria-label={`Photos for ${CATEGORY_LABEL[category]}`}
          >
            <Camera className="size-3.5" /> {count}
          </Link>
        </div>
      </div>
      <div className="space-y-2.5">{children}</div>
    </Card>
  );
}
