"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ArrowLeft, Camera, Check, CheckCircle2, ChevronLeft, ChevronRight, ClipboardList, FileText } from "lucide-react";
import { BrakeDisc, CarTopView, ShopIcon } from "@/components/brand";
import { PhotoCapture, type CaptureTarget } from "@/components/photo-capture";
import { Card, EmptyState, InfoPanel, LightChip, OkRecToggle } from "@/components/ui";
import {
  CORNERS,
  GRADE_LABEL,
  PRIORITIES,
  PRIORITY_LABEL,
  ROTOR_LABEL,
  SECTION_LABEL,
  SHEET_REPAIR_ORDER,
  SUMMARY_ORDER,
  SUSPENSION_PARTS,
  type BrakeAxle,
  type Corner,
  type Grade,
  type Inspection,
  type Light,
  type MediaSection,
  type Priority,
  type RotorGrade,
  type Section,
  type Settings,
  type SuspensionPart,
} from "@/lib/data";
import { SECTION_EXPLAINERS } from "@/lib/help";
import { completeInspection, updateInspection, useMe, useShop } from "@/lib/store";
import {
  GRADE_LIGHT,
  LIGHT_META,
  ROTOR_LIGHT,
  autoTireGrade,
  axleLight,
  blankInspection,
  cornerLights,
  fmtMiles,
  fmtTime,
  inspectionProgress,
  jobBundle,
  numOrNull,
  padGrade,
  sectionChip,
  suggestedPriority,
  tireGradeOf,
  vehicleLabel,
  vehiclePhoto,
} from "@/lib/utils";

type StepId = Section | "repairs";
const STEPS: { id: StepId; label: string; short: string }[] = [
  { id: "tires", label: "Tires", short: "Tires" },
  { id: "brakes", label: "Brakes", short: "Brakes" },
  { id: "suspension", label: "Suspension", short: "Susp." },
  { id: "alignment", label: "Alignment", short: "Align." },
  { id: "tpms", label: "TPMS", short: "TPMS" },
  { id: "repairs", label: "Repairs", short: "Repairs" },
];

const ACTIVE: Record<Light, string> = {
  green: "bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500",
  yellow: "bg-amber-50 text-amber-900 ring-2 ring-amber-400",
  red: "bg-red-50 text-red-800 ring-2 ring-red-500",
  blue: "bg-sky-50 text-sky-800 ring-2 ring-sky-500",
  none: "bg-slate-50 text-slate-700 ring-2 ring-slate-300",
};

const PRIORITY_ACTIVE: Record<Priority, string> = {
  ok: "bg-emerald-500 text-white ring-emerald-500",
  soon: "bg-amber-400 text-slate-950 ring-amber-400",
  future: "bg-sky-500 text-white ring-sky-500",
  now: "bg-red-600 text-white ring-red-600",
};

type StepProps = {
  ins: Inspection;
  s: Settings;
  update: (fn: (i: Inspection) => Inspection) => void;
  capture: (t: CaptureTarget) => void;
  count: (section: MediaSection, item?: string) => number;
};

export default function InspectionWizardPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const state = useShop();
  const me = useMe();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(() => {
    const i = STEPS.findIndex((x) => x.id === searchParams.get("step"));
    return i >= 0 ? i : 0;
  });
  const [capture, setCapture] = useState<CaptureTarget | null>(null);

  const b = jobBundle(state, jobId);
  if (!b) {
    return (
      <EmptyState
        title="Job not found"
        text="This inspection's work order doesn't exist."
        action={<Link href="/inspections" className="font-semibold text-blue-600">All inspections</Link>}
      />
    );
  }

  const { job, customer, vehicle, tech } = b;
  const s = state.settings;
  const ins = b.inspection ?? blankInspection(job.id, me.id);
  const update = (fn: (i: Inspection) => Inspection) => updateInspection(job.id, me.id, fn);
  const count = (section: MediaSection, item?: string) =>
    b.media.filter((m) => m.section === section && (item ? m.item === item : true)).length;
  const props: StepProps = { ins, s, update, capture: setCapture, count };
  const progress = inspectionProgress(b.inspection, s);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const go = (i: number) => {
    setStep(i);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const stepLight = (id: StepId): Light =>
    id === "repairs"
      ? SHEET_REPAIR_ORDER.every((sec) => ins.recommended[sec] !== null)
        ? "green"
        : "none"
      : sectionChip(ins, id, s).light;

  function finish() {
    completeInspection(job.id, me.id);
    router.push(`/inspections/${job.id}/complete`);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex items-center gap-3">
        <Link href={`/jobs/${job.id}`} aria-label="Back to job" className="grid size-10 shrink-0 place-items-center rounded-xl bg-white ring-1 ring-slate-200 hover:bg-slate-50">
          <ArrowLeft className="size-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-slate-950 sm:text-2xl">Inspection</h1>
          <p className="truncate text-sm text-slate-500">Technician view · {job.id}</p>
        </div>
        <Link href={`/inspections/${job.id}/sheet`} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-white px-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
          <FileText className="size-4" /> <span className="hidden sm:inline">Full sheet</span>
        </Link>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Card className="flex items-center gap-3 p-3">
            <img src={vehiclePhoto(vehicle)} alt="" className="h-14 w-20 shrink-0 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold text-slate-950">{vehicleLabel(vehicle)}</p>
              <p className="truncate text-xs text-slate-500">
                {vehicle.plate} | {fmtMiles(job.mileageIn || vehicle.mileage)} · {customer.name}
              </p>
              <p className="truncate text-xs text-slate-500">Tech: {(tech ?? me).name}</p>
            </div>
            <div className="w-20 shrink-0 text-right sm:w-28">
              <p className="text-xs font-semibold text-slate-500">{progress}% done</p>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </Card>

          {ins.completedAt && (
            <Link href={`/inspections/${job.id}/complete`} className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-800 ring-1 ring-emerald-200">
              <CheckCircle2 className="size-5 shrink-0" />
              <span className="flex-1">Completed at {fmtTime(ins.completedAt)}. Edits update the customer report.</span>
              <span className="font-semibold">Summary →</span>
            </Link>
          )}

          <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
            {STEPS.map((st, i) => {
              const active = i === step;
              const light = stepLight(st.id);
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => go(i)}
                  className={`relative flex flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-[10px] font-semibold transition sm:text-xs ${
                    active ? "bg-blue-50 text-blue-700 ring-2 ring-blue-600" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {st.id === "repairs" ? <ClipboardList className="size-6" /> : <ShopIcon name={st.id} className="size-6" />}
                  <span className="sm:hidden">{st.short}</span>
                  <span className="hidden sm:inline">{st.label}</span>
                  {light !== "none" && <span className={`absolute right-1.5 top-1.5 size-2.5 rounded-full ring-2 ring-white ${LIGHT_META[light].dot}`} />}
                </button>
              );
            })}
          </div>

          <div key={current.id} className="anim-fade-up">
            {current.id === "tires" && <TiresStep {...props} />}
            {current.id === "brakes" && <BrakesStep {...props} />}
            {current.id === "suspension" && <SuspensionStep {...props} />}
            {current.id === "alignment" && <AlignmentStep {...props} />}
            {current.id === "tpms" && <TpmsStep {...props} />}
            {current.id === "repairs" && <RepairsStep {...props} team={state.team} />}
          </div>

          <div className="sticky bottom-24 z-20 md:bottom-4">
            <div className="grid grid-cols-2 gap-3 rounded-2xl bg-white/90 p-2 shadow-lg ring-1 ring-slate-200 backdrop-blur">
              <button
                type="button"
                onClick={() => (step === 0 ? router.push(`/jobs/${job.id}`) : go(step - 1))}
                className="flex h-12 items-center justify-center gap-1 rounded-xl bg-slate-100 font-semibold text-slate-700 hover:bg-slate-200"
              >
                <ChevronLeft className="size-5" /> Back
              </button>
              {isLast ? (
                <button type="button" onClick={finish} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 font-bold text-white shadow-sm hover:bg-emerald-700">
                  <Check className="size-5" /> Complete Inspection
                </button>
              ) : (
                <button type="button" onClick={() => go(step + 1)} className="flex h-12 items-center justify-center gap-1 rounded-xl bg-blue-600 font-semibold text-white shadow-sm hover:bg-blue-700">
                  Next: {STEPS[step + 1].label} <ChevronRight className="size-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <InfoPanel
            title={SECTION_EXPLAINERS[current.id as Section]?.title ?? "Recommended repairs"}
            text={current.id === "repairs" ? "This final step turns the measurements into customer-facing repair priorities. Confirm what is OK, what is Soon, what can wait, and what needs attention now." : SECTION_EXPLAINERS[current.id as Section].text}
            tip={current.id === "repairs" ? "The customer report and the estimate both depend on these choices." : SECTION_EXPLAINERS[current.id as Section].customerText}
          />
          <Card className="anim-fade-up p-5">
            <h3 className="font-semibold text-slate-950">Technician reminder</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>• Enter the measurement first, then confirm the status colour.</li>
              <li>• Add at least one photo whenever the result is Soon, Recommended or Replace.</li>
              <li>• Write the note the way the customer should understand it.</li>
              <li>• Finish with the repairs step so the report summary reads clearly.</li>
            </ul>
          </Card>
        </div>
      </div>

      {capture && <PhotoCapture jobId={job.id} vehicleId={vehicle.id} target={capture} onClose={() => setCapture(null)} />}
    </div>
  );
}

function StepHeader({
  section,
  title,
  subtitle,
  chip,
  action,
}: {
  section?: Section;
  title: string;
  subtitle: string;
  chip?: { light: Light; label: string };
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-950 text-white">
          {section ? <ShopIcon name={section} className="size-5" /> : <ClipboardList className="size-5" />}
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-slate-950">{title}</h2>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {chip && chip.light !== "none" && <LightChip light={chip.light} label={chip.label} className="hidden sm:inline-flex" />}
        {action}
      </div>
    </div>
  );
}

function CameraButton({ count, onClick, label }: { count: number; onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label ?? "Add photo"}
      className="relative inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
    >
      <Camera className="size-4" />
      {label && <span>{label}</span>}
      {count > 0 && (
        <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-slate-950 text-[10px] font-bold text-white ring-2 ring-white">
          {count}
        </span>
      )}
    </button>
  );
}

function GradeButton({
  label,
  light,
  active,
  onClick,
  big = false,
}: {
  label: string;
  light: Light;
  active: boolean;
  onClick: () => void;
  big?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg text-xs font-semibold transition ${big ? "h-11 justify-center px-2 text-sm" : "px-2 py-1.5 text-left"} ${
        active ? ACTIVE[light] : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
      }`}
    >
      <span className={`grid size-4 shrink-0 place-items-center rounded-[4px] ${LIGHT_META[light].dot}`}>
        {active && <Check className="size-3 text-white" strokeWidth={3.5} />}
      </span>
      {label}
    </button>
  );
}

function NotesField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="mt-5 block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white p-3 text-[15px] outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
      />
    </label>
  );
}

const numCls =
  "h-12 rounded-xl border border-slate-200 bg-slate-50 text-center text-2xl font-bold text-slate-950 outline-none transition placeholder:text-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/15";

const setNote = (update: StepProps["update"], section: Section) => (v: string) =>
  update((i) => ({ ...i, notes: { ...i.notes, [section]: v } }));

function TiresStep({ ins, s, update, capture, count }: StepProps) {
  const setCorner = (c: Corner, patch: Partial<Inspection["tires"][Corner]>) =>
    update((i) => ({ ...i, tires: { ...i.tires, [c]: { ...i.tires[c], ...patch } } }));

  const corner = (c: Corner) => {
    const t = ins.tires[c];
    const grade = tireGradeOf(t, s);
    return (
      <div className={`rounded-2xl bg-white p-2.5 shadow-sm sm:p-3 ${grade ? `ring-2 ${LIGHT_META[GRADE_LIGHT[grade]].ring}` : "ring-1 ring-slate-200"}`}>
        <div className="flex items-center justify-between gap-1">
          <span className="text-base font-black text-slate-950">{c}</span>
          <CameraButton
            count={count("tires", c)}
            onClick={() =>
              capture({ section: "tires", item: c, title: `${c} Tire - ${t.tread ?? "—"}/32${grade ? ` (${GRADE_LABEL[grade]})` : ""}` })
            }
          />
        </div>
        <div className="mt-2 flex items-baseline justify-center gap-1">
          <input
            type="number"
            inputMode="decimal"
            step="0.5"
            min={0}
            max={20}
            value={t.tread ?? ""}
            placeholder="—"
            onChange={(e) => {
              const v = numOrNull(e.target.value);
              setCorner(c, { tread: v, grade: autoTireGrade(v, s) });
            }}
            aria-label={`${c} tread depth in 32nds`}
            className={`${numCls} w-16`}
          />
          <span className="text-sm font-semibold text-slate-500">/32</span>
        </div>
        <div className="mt-2 grid gap-1">
          {(["good", "soon", "replace"] as Grade[]).map((g) => (
            <GradeButton key={g} label={GRADE_LABEL[g]} light={GRADE_LIGHT[g]} active={grade === g} onClick={() => setCorner(c, { grade: g })} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className="p-4 sm:p-6">
      <StepHeader
        section="tires"
        title="Tire Inspection"
        subtitle={`Tread in 32nds: ${s.treadSoon + 1}+ Good · ${s.treadReplace + 1}–${s.treadSoon} Soon · ${s.treadReplace} or less Replace`}
        chip={sectionChip(ins, "tires", s)}
      />
      <div className="mb-4 grid grid-cols-2 gap-3">
        <input
          value={ins.tireSize}
          onChange={(e) => update((i) => ({ ...i, tireSize: e.target.value.toUpperCase() }))}
          placeholder="Tire size e.g. 225/65R17"
          aria-label="Tire size"
          className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
        />
        <input
          value={ins.tireBrand}
          onChange={(e) => update((i) => ({ ...i, tireBrand: e.target.value }))}
          placeholder="Brand / model"
          aria-label="Tire brand"
          className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
        />
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
        {corner("LF")}
        <CarTopView className="row-span-2 w-[68px] sm:w-28 md:w-36" lights={cornerLights(ins, s)} />
        {corner("RF")}
        {corner("LR")}
        {corner("RR")}
      </div>
      <NotesField label="Tire Notes" value={ins.notes.tires} onChange={setNote(update, "tires")} placeholder="Front tires wearing outer edge." />
    </Card>
  );
}

function BrakesStep({ ins, s, update, capture, count }: StepProps) {
  const setAxle = (a: "front" | "rear", patch: Partial<BrakeAxle>) =>
    update((i) => ({ ...i, brakes: { ...i.brakes, [a]: { ...i.brakes[a], ...patch } } }));

  const axleCard = (a: "front" | "rear") => {
    const ax = ins.brakes[a];
    const pg = padGrade(ax.pad, s);
    const light = axleLight(ins, a, s);
    const name = a === "front" ? "Front Brakes" : "Rear Brakes";
    return (
      <div className={`rounded-2xl bg-white p-4 ${light !== "none" ? `ring-2 ${LIGHT_META[light].ring}` : "ring-1 ring-slate-200"}`}>
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold text-slate-950">{name}</h3>
          <div className="flex items-center gap-2">
            {light !== "none" && <LightChip light={light} label={light === "red" ? "Replace" : light === "yellow" ? "Soon" : "Good"} />}
            <CameraButton
              count={count("brakes", a)}
              onClick={() => capture({ section: "brakes", item: a, title: `${name} - ${ax.pad ?? "—"} mm${pg ? ` (${GRADE_LABEL[pg]})` : ""}` })}
            />
          </div>
        </div>
        <p className="mt-4 text-sm font-medium text-slate-700">{a === "front" ? "Front" : "Rear"} Pads</p>
        <div className="mt-1.5 flex items-center gap-2">
          <input
            type="number"
            inputMode="decimal"
            step="0.5"
            min={0}
            max={20}
            value={ax.pad ?? ""}
            placeholder="—"
            onChange={(e) => setAxle(a, { pad: numOrNull(e.target.value) })}
            aria-label={`${name} pad thickness in mm`}
            className={`${numCls} w-24`}
          />
          <span className="text-sm font-semibold text-slate-500">mm</span>
          {pg && <LightChip light={GRADE_LIGHT[pg]} label={GRADE_LABEL[pg]} />}
        </div>
        <p className="mt-4 text-sm font-medium text-slate-700">Rotor</p>
        <div className="mt-1.5 grid grid-cols-3 gap-2">
          {(["good", "worn", "replace"] as RotorGrade[]).map((r) => (
            <GradeButton key={r} big label={ROTOR_LABEL[r]} light={ROTOR_LIGHT[r]} active={ax.rotor === r} onClick={() => setAxle(a, { rotor: r })} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className="p-4 sm:p-6">
      <StepHeader
        section="brakes"
        title="Brake Inspection"
        subtitle={`Pads in mm: ${s.padSoon + 1}+ Good · ${s.padReplace + 1}–${s.padSoon} Soon · ${s.padReplace} or less Replace`}
        chip={sectionChip(ins, "brakes", s)}
      />
      <div className="flex items-start gap-4">
        <BrakeDisc className="hidden w-28 shrink-0 lg:block" />
        <div className="grid flex-1 gap-3 md:grid-cols-2">
          {axleCard("front")}
          {axleCard("rear")}
        </div>
      </div>
      <NotesField label="Brake Notes" value={ins.notes.brakes} onChange={setNote(update, "brakes")} placeholder="Front pads at 3 mm. Rotor surface worn." />
    </Card>
  );
}

function SuspensionStep({ ins, s, update, capture, count }: StepProps) {
  const toggle = (p: SuspensionPart) =>
    update((i) => {
      const has = i.suspension.parts.includes(p);
      const parts = has ? i.suspension.parts.filter((x) => x !== p) : [...i.suspension.parts, p];
      return { ...i, suspension: { ...i.suspension, parts, status: parts.length ? "rec" : i.suspension.status } };
    });

  return (
    <Card className="p-4 sm:p-6">
      <StepHeader
        section="suspension"
        title="Suspension"
        subtitle="Tie rods, control arms, shocks and struts."
        chip={sectionChip(ins, "suspension", s)}
        action={<CameraButton count={count("suspension")} label="Photo" onClick={() => capture({ section: "suspension", title: "Suspension" })} />}
      />
      <OkRecToggle
        value={ins.suspension.status}
        onChange={(v) => update((i) => ({ ...i, suspension: { ...i.suspension, status: v, parts: v === "ok" ? [] : i.suspension.parts } }))}
      />
      <p className="mt-5 text-sm font-medium text-slate-700">Components needing attention</p>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {SUSPENSION_PARTS.map((p) => {
          const on = ins.suspension.parts.includes(p);
          return (
            <button
              key={p}
              type="button"
              onClick={() => toggle(p)}
              className={`flex h-12 items-center gap-2 rounded-xl px-3 text-left text-sm font-semibold transition ${
                on ? "bg-amber-50 text-amber-900 ring-2 ring-amber-400" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              <span className={`grid size-5 shrink-0 place-items-center rounded-md border-2 ${on ? "border-amber-500 bg-amber-400" : "border-slate-300"}`}>
                {on && <Check className="size-3.5 text-slate-950" strokeWidth={3} />}
              </span>
              {p}
            </button>
          );
        })}
      </div>
      {ins.suspension.parts.includes("Other") && (
        <input
          value={ins.suspension.other}
          onChange={(e) => update((i) => ({ ...i, suspension: { ...i.suspension, other: e.target.value } }))}
          placeholder="Other: describe the part"
          aria-label="Other suspension part"
          className="mt-3 h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
        />
      )}
      <NotesField label="Suspension Notes" value={ins.notes.suspension} onChange={setNote(update, "suspension")} placeholder="Outer tie rod play." />
    </Card>
  );
}

function AlignmentStep({ ins, s, update, capture, count }: StepProps) {
  return (
    <Card className="p-4 sm:p-6">
      <StepHeader
        section="alignment"
        title="Alignment"
        subtitle="Check tire wear pattern and steering. Pick an ALG package if alignment is needed."
        chip={sectionChip(ins, "alignment", s)}
        action={<CameraButton count={count("alignment")} label="Photo" onClick={() => capture({ section: "alignment", title: "Alignment" })} />}
      />
      <OkRecToggle
        value={ins.alignment.status}
        onChange={(v) => update((i) => ({ ...i, alignment: { status: v, package: v === "ok" ? null : i.alignment.package } }))}
      />
      <p className="mt-5 text-sm font-medium text-slate-700">ALG package</p>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {s.alignmentPackages.map((p) => {
          const on = ins.alignment.package === p.price;
          return (
            <button
              key={p.price}
              type="button"
              onClick={() => update((i) => ({ ...i, alignment: { status: "rec", package: on ? null : p.price } }))}
              className={`rounded-xl p-3 text-left transition ${on ? "bg-blue-50 ring-2 ring-blue-600" : "bg-white ring-1 ring-slate-200 hover:bg-slate-50"}`}
            >
              <span className="block text-xs font-semibold text-slate-500">ALG</span>
              <span className="block text-2xl font-black text-slate-950">{p.price}</span>
              <span className="block text-xs leading-tight text-slate-500">{p.label}</span>
            </button>
          );
        })}
      </div>
      <NotesField label="Alignment Notes" value={ins.notes.alignment} onChange={setNote(update, "alignment")} placeholder="Excessive outer tire wear." />
    </Card>
  );
}

function TpmsStep({ ins, s, update, capture, count }: StepProps) {
  return (
    <Card className="p-4 sm:p-6">
      <StepHeader
        section="tpms"
        title="TPMS"
        subtitle="Warning light, sensor readings and tire pressures."
        chip={sectionChip(ins, "tpms", s)}
        action={<CameraButton count={count("tpms")} label="Photo" onClick={() => capture({ section: "tpms", title: "TPMS" })} />}
      />
      <OkRecToggle value={ins.tpms.status} onChange={(v) => update((i) => ({ ...i, tpms: { ...i.tpms, status: v } }))} />
      <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_1.5fr]">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">TPM #</span>
          <input
            value={ins.tpms.tpmNumber}
            onChange={(e) => update((i) => ({ ...i, tpms: { ...i.tpms, tpmNumber: e.target.value } }))}
            placeholder="Sensor part # / qty"
            className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
          />
        </label>
        <div>
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Pressures (PSI)</span>
          <div className="grid grid-cols-4 gap-2">
            {CORNERS.map((c) => (
              <label key={c} className="block text-center">
                <span className="text-xs font-bold text-slate-500">{c}</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={80}
                  value={ins.tpms.psi[c] ?? ""}
                  placeholder="—"
                  onChange={(e) => update((i) => ({ ...i, tpms: { ...i.tpms, psi: { ...i.tpms.psi, [c]: numOrNull(e.target.value) } } }))}
                  aria-label={`${c} pressure`}
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 text-center text-lg font-bold outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/15"
                />
              </label>
            ))}
          </div>
        </div>
      </div>
      <NotesField label="TPMS Notes" value={ins.notes.tpms} onChange={setNote(update, "tpms")} placeholder="No issues." />
    </Card>
  );
}

function RepairsStep({ ins, s, update, team }: StepProps & { team: { id: string; name: string }[] }) {
  return (
    <Card className="p-4 sm:p-6">
      <StepHeader title="Recommended Repairs" subtitle="Pre-filled from your findings. Tap to change the priority." />
      <div className="divide-y divide-slate-100">
        {SHEET_REPAIR_ORDER.map((sec) => {
          const explicit = ins.recommended[sec];
          const suggested = suggestedPriority(ins, sec, s);
          const value = explicit ?? suggested;
          return (
            <div key={sec} className="grid gap-2 py-3 sm:grid-cols-[170px_1fr] sm:items-center">
              <div className="flex items-center gap-2">
                <ShopIcon name={sec} className="size-6 text-slate-700" />
                <span className="font-bold text-slate-900">{SECTION_LABEL[sec]}</span>
                {!explicit && suggested && (
                  <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-blue-700">auto</span>
                )}
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {PRIORITIES.map((p) => {
                  const on = value === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => update((i) => ({ ...i, recommended: { ...i.recommended, [sec]: p } }))}
                      className={`h-11 rounded-xl text-sm font-bold ring-1 transition ${on ? PRIORITY_ACTIVE[p] : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"} ${
                        on && !explicit ? "opacity-80" : ""
                      }`}
                    >
                      {PRIORITY_LABEL[p]}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <label className="mt-5 block">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">Notes / Additional Repairs</span>
        <textarea
          value={ins.additionalNotes}
          onChange={(e) => update((i) => ({ ...i, additionalNotes: e.target.value }))}
          rows={3}
          placeholder="Anything else the customer should know…"
          className="w-full rounded-xl border border-slate-200 p-3 text-[15px] outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
        />
      </label>

      <label className="mt-4 block">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">Inspected by</span>
        <select
          value={ins.techId ?? ""}
          onChange={(e) => update((i) => ({ ...i, techId: e.target.value || null }))}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
        >
          <option value="">Select technician</option>
          {team.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </label>

      <div className="mt-5 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Customer will see</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {SUMMARY_ORDER.map((sec) => {
            const chip = sectionChip(ins, sec, s);
            return (
              <span key={sec} className="flex items-center gap-2 rounded-xl bg-white px-2.5 py-1.5 text-sm ring-1 ring-slate-200">
                <ShopIcon name={sec} className="size-4 text-slate-500" />
                {SECTION_LABEL[sec]}
                <LightChip light={chip.light} label={chip.label} size="sm" />
              </span>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
