import type { ReactNode } from "react";
import { BrakeDisc, CarTopView, CastleLogo, ShopIcon } from "@/components/brand";
import {
  PRIORITIES,
  PRIORITY_LABEL,
  SECTION_LABEL,
  SHEET_REPAIR_ORDER,
  SUSPENSION_PARTS,
  type Corner,
  type Customer,
  type Inspection,
  type Job,
  type Settings,
  type Vehicle,
} from "@/lib/data";
import { cornerLights, effectivePriority, fmtDate, padGrade, tireGradeOf } from "@/lib/utils";

const SWATCH = { green: "bg-emerald-500", yellow: "bg-amber-400", red: "bg-red-600" } as const;

function ColorBox({ color, checked, label }: { color: keyof typeof SWATCH; checked: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${checked ? "font-bold text-slate-950" : "text-slate-500"}`}>
      <span className={`grid size-4 place-items-center rounded-[3px] ${SWATCH[color]} ${checked ? "ring-2 ring-slate-900 ring-offset-1" : "opacity-35"}`}>
        {checked && <span className="text-[11px] font-black leading-none text-white">✓</span>}
      </span>
      {label}
    </span>
  );
}

function Box({ checked, label }: { checked: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap ${checked ? "font-bold text-slate-950" : "text-slate-600"}`}>
      <span className={`grid size-4 shrink-0 place-items-center rounded-[3px] border-2 ${checked ? "border-slate-900 bg-slate-900" : "border-slate-400 bg-white"}`}>
        {checked && <span className="text-[10px] font-black leading-none text-white">✓</span>}
      </span>
      {label}
    </span>
  );
}

function Fill({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-block min-w-12 border-b-2 border-slate-400 px-1 text-center font-handwriting font-bold text-blue-800 ${className}`}>
      {children || "\u00a0"}
    </span>
  );
}

const SECTION_STYLES = {
  blue: { head: "bg-[#1d6fd1] text-white", border: "border-[#1d6fd1]" },
  red: { head: "bg-[#d7141f] text-white", border: "border-[#d7141f]" },
  green: { head: "bg-[#169c46] text-white", border: "border-[#169c46]" },
  slate: { head: "bg-slate-600 text-white", border: "border-slate-500" },
  yellow: { head: "bg-[#f6c90e] text-slate-950", border: "border-[#f6c90e]" },
} as const;

function SheetSection({
  title,
  color,
  className = "",
  children,
}: {
  title: string;
  color: keyof typeof SECTION_STYLES;
  className?: string;
  children: ReactNode;
}) {
  const st = SECTION_STYLES[color];
  return (
    <section className={`overflow-hidden rounded-lg border-2 ${st.border} bg-white ${className}`}>
      <h3 className={`px-3 py-1.5 text-base font-black uppercase tracking-wide sm:text-lg ${st.head}`} style={{ fontFamily: "Impact, 'Arial Narrow Bold', 'Arial Black', sans-serif" }}>
        {title}
      </h3>
      <div className="p-3">{children}</div>
    </section>
  );
}

export function InspectionSheet({
  job,
  customer,
  vehicle,
  inspection,
  techName,
  settings,
}: {
  job: Job;
  customer: Customer;
  vehicle: Vehicle;
  inspection: Inspection;
  techName: string;
  settings: Settings;
}) {
  const ins = inspection;
  const lights = cornerLights(ins, settings);

  const tireBox = (c: Corner) => {
    const grade = tireGradeOf(ins.tires[c], settings);
    return (
      <div className="rounded-lg border-2 border-sky-400 bg-white p-2 text-[13px]">
        <div className="flex items-center gap-1.5">
          <ShopIcon name="tires" className="size-6 text-slate-800" />
          <span className="font-black">{c}:</span>
          <Fill className="min-w-0 flex-1 text-left text-xs">{ins.tireSize}</Fill>
        </div>
        <p className="mt-1.5">
          Tread: <Fill>{ins.tires[c].tread ?? ""}</Fill>/32
        </p>
        <div className="mt-1.5 grid gap-1">
          <ColorBox color="green" checked={grade === "good"} label="Good" />
          <ColorBox color="yellow" checked={grade === "soon"} label="Soon" />
          <ColorBox color="red" checked={grade === "replace"} label="Replace" />
        </div>
      </div>
    );
  };

  const axle = (name: "front" | "rear") => {
    const a = ins.brakes[name];
    return (
      <div className="space-y-1.5">
        <p className="font-bold">
          {name === "front" ? "Front" : "Rear"} Pads: <Fill>{a.pad ?? ""}</Fill> mm
          {padGrade(a.pad, settings) === "replace" && <span className="ml-2 text-xs font-bold text-red-600">(replace)</span>}
        </p>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-bold">Rotor:</span>
          <ColorBox color="green" checked={a.rotor === "good"} label="Good" />
          <ColorBox color="yellow" checked={a.rotor === "worn"} label="Worn" />
          <ColorBox color="red" checked={a.rotor === "replace"} label="Replace" />
        </p>
      </div>
    );
  };

  const noteLines = [
    ins.additionalNotes,
    ...(["tires", "brakes", "tpms", "suspension", "alignment"] as const)
      .map((s) => (ins.notes[s] ? `${SECTION_LABEL[s]}: ${ins.notes[s]}` : ""))
      .filter(Boolean),
  ].filter(Boolean);

  return (
    <div className="mx-auto w-full max-w-[1100px] rounded-xl bg-white p-3 text-slate-900 shadow-sm ring-1 ring-slate-200 sm:p-5 print:rounded-none print:p-0 print:shadow-none print:ring-0">
      {/* Header */}
      <div className="grid items-center gap-3 md:grid-cols-[auto_1fr_auto]">
        <CastleLogo tagline className="h-16 w-auto sm:h-20" />
        <h1 className="text-center text-2xl font-black tracking-tight sm:text-4xl" style={{ fontFamily: "Impact, 'Arial Narrow Bold', 'Arial Black', sans-serif" }}>
          VEHICLE INSPECTION SHEET
        </h1>
        <div className="min-w-56 space-y-1.5 rounded-lg bg-slate-100 px-4 py-2.5 text-sm">
          <p className="font-bold">Date: <Fill className="min-w-32">{fmtDate((ins.completedAt ?? job.date).slice(0, 10), { month: "2-digit", day: "2-digit", year: "numeric" })}</Fill></p>
          <p className="font-bold">Tech: <Fill className="min-w-32">{techName}</Fill></p>
        </div>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="space-y-2 rounded-lg border-2 border-slate-300 p-3 text-sm">
          <p className="font-bold">Customer: <Fill className="min-w-48">{customer.name}</Fill></p>
          <p className="font-bold">Phone: <Fill className="min-w-48">{customer.phone}</Fill></p>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg border-2 border-slate-300 p-3 text-sm">
          <p className="font-bold">Year: <Fill>{vehicle.year}</Fill></p>
          <p className="font-bold">Plate: <Fill className="font-mono">{vehicle.plate}</Fill></p>
          <p className="font-bold">Model: <Fill className="min-w-24">{vehicle.make} {vehicle.model}</Fill></p>
          <p className="font-bold">Mileage: <Fill>{(job.mileageIn || vehicle.mileage).toLocaleString("en-US")}</Fill></p>
        </div>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <SheetSection title="Tires" color="blue" className="md:row-span-2">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            {tireBox("LF")}
            <CarTopView className="row-span-2 w-20 sm:w-28" lights={lights} />
            {tireBox("RF")}
            {tireBox("LR")}
            {tireBox("RR")}
          </div>
          {ins.tireBrand && <p className="mt-2 text-xs text-slate-500">Tires: {ins.tireBrand} {ins.tireSize}</p>}
        </SheetSection>

        <SheetSection title="Brakes" color="red">
          <div className="flex gap-3 text-sm">
            <BrakeDisc className="hidden w-24 shrink-0 sm:block" />
            <div className="flex-1 space-y-3">
              {axle("front")}
              <hr className="border-slate-200" />
              {axle("rear")}
            </div>
          </div>
        </SheetSection>

        <SheetSection title="TPMS / Suspension / Alignment" color="green">
          <div className="divide-y divide-slate-200 text-sm">
            <div className="grid grid-cols-[110px_80px_1fr] items-center gap-2 py-2">
              <span className="flex items-center gap-1.5 font-black"><ShopIcon name="tpms" className="size-6" /> TPMS</span>
              <span className="grid gap-1">
                <Box checked={ins.tpms.status === "ok"} label="OK" />
                <Box checked={ins.tpms.status === "rec"} label="Rec" />
              </span>
              <span className="font-bold">TPM #: <Fill className="min-w-20">{ins.tpms.tpmNumber}</Fill></span>
            </div>
            <div className="grid grid-cols-[110px_80px_1fr] items-center gap-2 py-2">
              <span className="flex items-center gap-1.5 font-black"><ShopIcon name="suspension" className="size-6" /> SUSP.</span>
              <span className="grid gap-1">
                <Box checked={ins.suspension.status === "ok"} label="OK" />
                <Box checked={ins.suspension.status === "rec"} label="Rec" />
              </span>
              <span className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                {SUSPENSION_PARTS.map((p) => (
                  <Box key={p} checked={ins.suspension.parts.includes(p)} label={p === "Other" ? `Other: ${ins.suspension.other || "____"}` : p} />
                ))}
              </span>
            </div>
            <div className="grid grid-cols-[110px_80px_1fr] items-center gap-2 py-2">
              <span className="flex items-center gap-1.5 font-black"><ShopIcon name="alignment" className="size-6" /> ALIGN.</span>
              <span className="grid gap-1">
                <Box checked={ins.alignment.status === "ok"} label="OK" />
                <Box checked={ins.alignment.status === "rec"} label="Rec" />
              </span>
              <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-bold">ALG:</span>
                {settings.alignmentPackages.map((p) => (
                  <Box key={p.price} checked={ins.alignment.package === p.price} label={String(p.price)} />
                ))}
              </span>
            </div>
          </div>
        </SheetSection>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <SheetSection title="Notes / Additional Repairs" color="slate">
          <div
            className="min-h-40 text-sm leading-8 text-blue-900"
            style={{ backgroundImage: "repeating-linear-gradient(transparent, transparent 31px, #cbd5e1 31px, #cbd5e1 32px)" }}
          >
            {noteLines.length ? noteLines.map((l, i) => <p key={i} className="font-handwriting">{l}</p>) : <p>&nbsp;</p>}
          </div>
        </SheetSection>

        <SheetSection title="Recommended Repairs" color="yellow">
          <div className="divide-y divide-slate-200 text-sm">
            {SHEET_REPAIR_ORDER.map((sec) => {
              const p = effectivePriority(ins, sec, settings);
              return (
                <div key={sec} className="grid grid-cols-[120px_1fr] items-center gap-2 py-1.5">
                  <span className="flex items-center gap-2 font-black">
                    <ShopIcon name={sec} className="size-6" />
                    {SECTION_LABEL[sec]}
                  </span>
                  <span className="grid grid-cols-4 gap-1 text-xs sm:text-sm">
                    {PRIORITIES.map((pr) => (
                      <Box key={pr} checked={p === pr} label={PRIORITY_LABEL[pr]} />
                    ))}
                  </span>
                </div>
              );
            })}
          </div>
        </SheetSection>
      </div>

      <p className="mt-3 text-center text-[11px] text-slate-500">
        {settings.shopName} · {settings.address} · {settings.phone} · Work order {job.id}
      </p>
    </div>
  );
}
