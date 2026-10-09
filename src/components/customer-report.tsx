"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Check, CheckCircle2, ChevronLeft, ChevronRight, Clock, FileText, MapPin, MessageSquare, Phone, Printer } from "lucide-react";
import { CastleLogo, ShopIcon } from "@/components/brand";
import { InspectionSheet } from "@/components/inspection-sheet";
import { LightChip, SolidChip } from "@/components/ui";
import { SECTION_EXPLAINERS } from "@/lib/help";
import {
  CORNERS,
  GRADE_LABEL,
  PRIORITY_LABEL,
  SECTION_LABEL,
  SUMMARY_ORDER,
  type Inspection,
  type Light,
  type Media,
  type Section,
  type Settings,
} from "@/lib/data";
import { approveEstimate, useHydrated, useShop } from "@/lib/store";
import {
  GRADE_LIGHT,
  LIGHT_META,
  PRIORITY_LIGHT,
  axleLight,
  byId,
  effectivePriority,
  estimateTotals,
  fmtDate,
  fmtDateTime,
  fmtTime,
  jobBundle,
  money,
  overallLight,
  padGrade,
  sectionChip,
  sectionNote,
  smsHref,
  telHref,
  tireGradeOf,
  vehicleLabel,
  vehiclePhoto,
} from "@/lib/utils";

const IMPACT = { fontFamily: "Impact, 'Arial Narrow Bold', 'Arial Black', sans-serif" };

function ReportSkeleton() {
  return (
    <div className="min-h-dvh bg-slate-100 p-4">
      <div className="mx-auto max-w-2xl animate-pulse space-y-4">
        <div className="h-14 rounded-2xl bg-white" />
        <div className="h-48 rounded-3xl bg-white" />
        <div className="h-72 rounded-3xl bg-white" />
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center bg-slate-100 p-6 text-center">
      <div className="max-w-sm rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <CastleLogo className="mx-auto h-12 w-auto" />
        <h1 className="mt-5 text-xl font-bold text-slate-950">Report not found</h1>
        <p className="mt-2 text-sm text-slate-600">
          This link may have expired. In this demo, reports created on another device only open in the browser that created them.
        </p>
      </div>
    </div>
  );
}

export function CustomerReport({ code }: { code: string }) {
  const hydrated = useHydrated();
  if (!hydrated) return <ReportSkeleton />;
  return <ReportBody code={code} />;
}

export function PublicSheet({ code }: { code: string }) {
  const hydrated = useHydrated();
  if (!hydrated) return <ReportSkeleton />;
  return <PublicSheetBody code={code} />;
}

function useReport(code: string) {
  const state = useShop();
  const report = state.reports.find((r) => r.code.toUpperCase() === code.toUpperCase());
  const b = report ? jobBundle(state, report.jobId) : null;
  return { state, report, b };
}

function ReportBody({ code }: { code: string }) {
  const { state, report, b } = useReport(code);
  const [open, setOpen] = useState<Section | null>(null);
  const [showAll, setShowAll] = useState(false);
  if (!report || !b || !b.inspection) return <NotFound />;

  const { job, customer, vehicle, estimate, media } = b;
  const ins = b.inspection;
  const s = state.settings;
  const tech = byId(state.team, ins.techId);
  const overall = overallLight(ins, s);
  const first = customer.name.split(" ")[0];

  const toggle = (sec: Section) => {
    const next = open === sec ? null : sec;
    setOpen(next);
    if (next) setTimeout(() => document.getElementById(`sec-${sec}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  };

  const recs = SUMMARY_ORDER.map((sec) => ({ sec, p: effectivePriority(ins, sec, s) })).filter((r) => r.p && r.p !== "ok");

  return (
    <div className="min-h-dvh bg-slate-100 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-2">
          <CastleLogo className="h-10 w-auto" />
          <div className="flex gap-2">
            <a href={telHref(s.phone)} aria-label="Call the shop" className="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-800">
              <Phone className="size-5" />
            </a>
            <a href={smsHref(s.phone, `Hi ${s.shopName}, I have a question about my inspection report.`)} aria-label="Text the shop" className="grid size-10 place-items-center rounded-xl bg-blue-600 text-white">
              <MessageSquare className="size-5" />
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-4 px-4 py-5">
        <section className="anim-fade-up rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h1 className="text-center text-2xl tracking-wide text-slate-950" style={IMPACT}>
            VEHICLE INSPECTION REPORT
          </h1>
          <div className="mt-4 grid grid-cols-[1fr_auto] items-center gap-4">
            <div className="min-w-0 space-y-0.5">
              <p className="text-lg font-bold leading-tight">{vehicleLabel(vehicle)}</p>
              <p className="text-sm text-slate-600">Plate: <span className="font-semibold text-slate-800">{vehicle.plate}</span></p>
              <p className="text-sm text-slate-600">Mileage: <span className="font-semibold text-slate-800">{(job.mileageIn || vehicle.mileage).toLocaleString("en-US")}</span></p>
              <p className="text-sm text-slate-600">Date: <span className="font-semibold text-slate-800">{fmtDate(job.date, { month: "short", day: "numeric", year: "numeric" })}</span></p>
            </div>
            <img src={vehiclePhoto(vehicle)} alt={vehicleLabel(vehicle)} className="h-24 w-32 rounded-2xl object-cover sm:h-28 sm:w-40" />
          </div>
          <div className={`mt-4 flex items-center gap-3 rounded-2xl p-3 ${overall === "red" ? "bg-red-50" : overall === "yellow" ? "bg-amber-50" : "bg-emerald-50"}`}>
            <span className={`size-3 shrink-0 rounded-full ${LIGHT_META[overall].dot}`} />
            <p className="text-sm text-slate-800">
              Hi {first}, {tech ? `${tech.name.split(" ")[0]} ` : "we "}inspected your vehicle
              {ins.completedAt ? ` at ${fmtTime(ins.completedAt)}` : ""}.{" "}
              {overall === "red"
                ? "Some items need attention now."
                : overall === "yellow"
                  ? "A few items should be planned soon."
                  : "Everything checked looks good."}
            </p>
          </div>
        </section>

        <section className="anim-fade-up overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <h2 className="px-5 pt-4 text-base font-bold">Inspection Summary</h2>
          <ul className="mt-1 divide-y divide-slate-100">
            {SUMMARY_ORDER.map((sec) => {
              const chip = sectionChip(ins, sec, s);
              return (
                <li key={sec}>
                  <button type="button" onClick={() => toggle(sec)} className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition hover:bg-slate-50">
                    <ShopIcon name={sec} className="size-7 shrink-0 text-slate-800" />
                    <span className="flex-1 font-semibold">{SECTION_LABEL[sec]}</span>
                    <SolidChip light={chip.light} label={chip.label} />
                    <ChevronRight className={`size-5 shrink-0 text-slate-400 transition ${open === sec || showAll ? "rotate-90" : ""}`} />
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="p-4">
            <button
              type="button"
              onClick={() => {
                setShowAll((v) => !v);
                setTimeout(() => document.getElementById("details")?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
              }}
              className="h-12 w-full rounded-xl bg-blue-600 font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              {showAll ? "Hide Details" : "View Full Details & Photos"}
            </button>
          </div>
        </section>

        <section className="anim-fade-up rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-base font-bold text-slate-950">How to read this report</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Green means the item looks good. Yellow means the shop recommends planning the repair soon. Red means the item should be repaired now.
            Tap any section below to see more detail and the technician's photos.
          </p>
        </section>

        <div id="details" className="scroll-mt-20 space-y-4">
          {SUMMARY_ORDER.filter((sec) => showAll || open === sec).map((sec) => (
            <DetailSection key={sec} sec={sec} ins={ins} s={s} media={media.filter((m) => m.section === sec)} />
          ))}
        </div>

        {(estimate || recs.length > 0) && (
          <section className="anim-fade-up rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-base font-bold">Recommended work</h2>
            {estimate ? (
              <EstimateBlock estimateId={estimate.id} />
            ) : (
              <ul className="mt-3 space-y-2">
                {recs.map(({ sec, p }) => (
                  <li key={sec} className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
                    <ShopIcon name={sec} className="mt-0.5 size-5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{SECTION_LABEL[sec]}</p>
                      <p className="text-sm text-slate-600">{sectionNote(ins, sec)}</p>
                    </div>
                    {p && <LightChip light={PRIORITY_LIGHT[p]} label={PRIORITY_LABEL[p]} />}
                  </li>
                ))}
                <li className="pt-1 text-sm text-slate-600">Call or text us to schedule. We&apos;ll send a written estimate first.</li>
              </ul>
            )}
          </section>
        )}

        {ins.additionalNotes && (
          <section className="anim-fade-up rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-base font-bold">Technician notes</h2>
            <p className="mt-2 leading-relaxed text-slate-700">{ins.additionalNotes}</p>
            {tech && <p className="mt-2 text-sm text-slate-500">— {tech.name}</p>}
          </section>
        )}

        <Link href={`/r/${report.code}/sheet`} className="flex items-center justify-center gap-2 rounded-2xl bg-white p-4 font-semibold text-slate-800 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50">
          <FileText className="size-5 text-blue-600" /> View the full inspection sheet
        </Link>

        <section className="rounded-3xl bg-slate-950 p-5 text-white shadow-lg">
          <p className="text-lg font-bold">Questions, {first}? We&apos;re here.</p>
          <p className="mt-2 flex items-center gap-2 text-sm text-slate-300"><MapPin className="size-4 shrink-0" /> {s.address}</p>
          <p className="mt-1 flex items-center gap-2 text-sm text-slate-300"><Clock className="size-4 shrink-0" /> {s.hours}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <a href={telHref(s.phone)} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 text-sm font-semibold">
              <Phone className="size-4" /> Call
            </a>
            <a href={smsHref(s.phone, `Hi ${s.shopName}, question about report ${report.code}`)} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-white/10 text-sm font-semibold ring-1 ring-white/15">
              <MessageSquare className="size-4" /> Text us
            </a>
          </div>
        </section>
        <p className="pb-6 text-center text-xs text-slate-500">
          {s.shopName} · Report {report.code} · No app needed
        </p>
      </main>
    </div>
  );
}

function Legend({ options, value }: { options: { id: string; label: string; light: Light }[]; value: string | null }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {options.map((o) => {
        const on = value === o.id;
        return (
          <span key={o.id} className={`inline-flex items-center gap-1.5 text-sm ${on ? "font-bold text-slate-950" : "text-slate-400"}`}>
            <span className={`grid size-4 place-items-center rounded-[4px] ${LIGHT_META[o.light].dot} ${on ? "ring-2 ring-slate-900 ring-offset-1" : "opacity-40"}`}>
              {on && <Check className="size-3 text-white" strokeWidth={3.5} />}
            </span>
            {o.label}
          </span>
        );
      })}
    </div>
  );
}

const ROTOR_OPTS = [
  { id: "good", label: "Good", light: "green" as Light },
  { id: "worn", label: "Worn", light: "yellow" as Light },
  { id: "replace", label: "Replace", light: "red" as Light },
];

function DetailSection({ sec, ins, s, media }: { sec: Section; ins: Inspection; s: Settings; media: Media[] }) {
  const chip = sectionChip(ins, sec, s);
  return (
    <section id={`sec-${sec}`} className="anim-fade-up scroll-mt-20 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between gap-3 px-5 pt-4">
        <h3 className="flex items-center gap-2 text-lg font-bold">
          <ShopIcon name={sec} className="size-6" />
          {sec === "brakes" ? "Brakes" : SECTION_LABEL[sec]}
        </h3>
        <SolidChip light={chip.light} label={chip.label} />
      </div>

      <div className="space-y-3 px-5 py-4 text-sm">
        <p className="rounded-xl bg-slate-50 p-3 text-slate-600 ring-1 ring-slate-200">{SECTION_EXPLAINERS[sec].customerText}</p>
        {sec === "tires" && (
          <>
            <div className="grid grid-cols-2 gap-2">
              {CORNERS.map((c) => {
                const g = tireGradeOf(ins.tires[c], s);
                return (
                  <div key={c} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-200">
                    <span>
                      <span className="font-black">{c}</span>{" "}
                      <span className="text-slate-700">{ins.tires[c].tread ?? "—"}/32</span>
                    </span>
                    {g && <LightChip light={GRADE_LIGHT[g]} label={GRADE_LABEL[g]} size="sm" />}
                  </div>
                );
              })}
            </div>
            {(ins.tireSize || ins.tireBrand) && (
              <p className="text-slate-500">
                {ins.tireBrand} {ins.tireSize}
              </p>
            )}
            <p className="text-xs text-slate-500">Tread is measured in 32nds of an inch. New tires are about 10/32. 2/32 is the legal minimum.</p>
          </>
        )}
        {sec === "brakes" &&
          (["front", "rear"] as const).map((a) => {
            const ax = ins.brakes[a];
            const light = axleLight(ins, a, s);
            const pg = padGrade(ax.pad, s);
            return (
              <div key={a} className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
                <div className="flex items-center justify-between">
                  <p className="font-bold">{a === "front" ? "Front Brakes" : "Rear Brakes"}</p>
                  {light !== "none" && <LightChip light={light} label={light === "red" ? "Replace" : light === "yellow" ? "Soon" : "Good"} size="sm" />}
                </div>
                <p className="mt-1.5">
                  {a === "front" ? "Front" : "Rear"} Pads: <span className="font-bold">{ax.pad ?? "—"} mm</span>
                  {pg && <span className="ml-1 text-slate-500">({GRADE_LABEL[pg]})</span>}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="text-slate-600">Rotor:</span>
                  <Legend options={ROTOR_OPTS} value={ax.rotor} />
                </div>
              </div>
            );
          })}
        {sec === "tpms" && (
          <>
            <p>
              Status: <span className="font-bold">{ins.tpms.status === "ok" ? "OK" : ins.tpms.status === "rec" ? "Service recommended" : "Not checked"}</span>
              {ins.tpms.tpmNumber && <span className="text-slate-500"> · TPM # {ins.tpms.tpmNumber}</span>}
            </p>
            <div className="grid grid-cols-4 gap-2 text-center">
              {CORNERS.map((c) => (
                <div key={c} className="rounded-xl bg-slate-50 py-2 ring-1 ring-slate-200">
                  <p className="text-xs font-bold text-slate-500">{c}</p>
                  <p className="font-bold">{ins.tpms.psi[c] ?? "—"}</p>
                  <p className="text-[10px] text-slate-400">PSI</p>
                </div>
              ))}
            </div>
          </>
        )}
        {sec === "suspension" && (
          <>
            <p>
              Status: <span className="font-bold">{ins.suspension.status === "ok" ? "OK" : ins.suspension.status === "rec" ? "Repair recommended" : "Not checked"}</span>
            </p>
            {ins.suspension.parts.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {ins.suspension.parts.map((p) => (
                  <li key={p} className="rounded-lg bg-amber-50 px-2.5 py-1 font-semibold text-amber-900 ring-1 ring-amber-300">
                    {p === "Other" ? ins.suspension.other || "Other" : p}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
        {sec === "alignment" && (
          <p>
            Status: <span className="font-bold">{ins.alignment.status === "ok" ? "OK" : ins.alignment.status === "rec" ? "Alignment recommended" : "Not checked"}</span>
            {ins.alignment.package && (
              <span className="text-slate-600">
                {" "}· ALG {ins.alignment.package}: {s.alignmentPackages.find((p) => p.price === ins.alignment.package)?.label} ({money(ins.alignment.package)})
              </span>
            )}
          </p>
        )}
      </div>

      {media.length > 0 && <Carousel items={media} />}

      <div className="border-t border-slate-100 px-5 py-3 text-sm">
        <p className="font-semibold">Notes</p>
        <p className="text-slate-600">{sectionNote(ins, sec)}</p>
      </div>
    </section>
  );
}

function Carousel({ items }: { items: Media[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * (ref.current.clientWidth * 0.85), behavior: "smooth" });
  return (
    <div className="relative px-5">
      <div ref={ref} className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto">
        {items.map((m) => (
          <figure key={m.id} className="w-[85%] shrink-0 snap-center overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200 sm:w-[70%]">
            {m.type === "video" ? (
              <video src={m.url} poster={m.poster} controls playsInline preload="none" className="aspect-[4/3] w-full bg-black object-cover" />
            ) : (
              <img src={m.url} alt={m.caption} loading="lazy" className="aspect-[4/3] w-full object-cover" />
            )}
            <figcaption className="px-3 py-2 text-xs font-medium text-slate-700">
              {m.item ? `${m.item.toUpperCase()} · ` : ""}
              {m.caption}
            </figcaption>
          </figure>
        ))}
      </div>
      {items.length > 1 && (
        <>
          <button type="button" onClick={() => scroll(-1)} aria-label="Previous photo" className="absolute left-2 top-[40%] grid size-9 place-items-center rounded-full bg-white/95 shadow ring-1 ring-slate-200">
            <ChevronLeft className="size-5" />
          </button>
          <button type="button" onClick={() => scroll(1)} aria-label="Next photo" className="absolute right-2 top-[40%] grid size-9 place-items-center rounded-full bg-white/95 shadow ring-1 ring-slate-200">
            <ChevronRight className="size-5" />
          </button>
        </>
      )}
    </div>
  );
}

function EstimateBlock({ estimateId }: { estimateId: string }) {
  const state = useShop();
  const estimate = state.estimates.find((e) => e.id === estimateId);
  if (!estimate) return null;
  const t = estimateTotals(estimate, state.settings.taxRate);
  const approved = estimate.status === "approved";
  return (
    <div className="mt-3">
      <ul className="divide-y divide-slate-100">
        {estimate.lines.map((l) => (
          <li key={l.id} className="flex items-start justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <p className={`font-medium ${l.decision === "declined" ? "text-slate-400 line-through" : ""}`}>{l.description}</p>
              <div className="mt-1 flex items-center gap-2">
                <LightChip light={PRIORITY_LIGHT[l.priority]} label={PRIORITY_LABEL[l.priority]} size="sm" />
                {l.decision !== "pending" && <span className="text-xs font-semibold capitalize text-slate-500">{l.decision}</span>}
              </div>
            </div>
            <p className="shrink-0 font-semibold">{money(l.parts + l.labor)}</p>
          </li>
        ))}
      </ul>
      <dl className="mt-2 space-y-1 border-t border-slate-100 pt-3 text-sm">
        <div className="flex justify-between text-slate-600"><dt>Parts</dt><dd>{money(t.parts, true)}</dd></div>
        <div className="flex justify-between text-slate-600"><dt>Labor</dt><dd>{money(t.labor, true)}</dd></div>
        <div className="flex justify-between text-slate-600"><dt>MA sales tax ({state.settings.taxRate}% on parts)</dt><dd>{money(t.tax, true)}</dd></div>
        <div className="flex justify-between text-base font-bold"><dt>Total</dt><dd>{money(t.total, true)}</dd></div>
      </dl>
      {approved ? (
        <div className="anim-pop mt-4 flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-800 ring-1 ring-emerald-200">
          <CheckCircle2 className="size-6 shrink-0" />
          <p className="text-sm">
            <span className="font-bold">Approved{estimate.approvedAt ? ` ${fmtDateTime(estimate.approvedAt)}` : ""}.</span> Thank you! We&apos;ll get started and text you when it&apos;s ready.
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => approveEstimate(estimate.id, "customer", true)}
          className="mt-4 h-12 w-full rounded-xl bg-emerald-600 font-bold text-white shadow-sm transition hover:bg-emerald-700"
        >
          Approve recommended work
        </button>
      )}
    </div>
  );
}

function PublicSheetBody({ code }: { code: string }) {
  const { state, report, b } = useReport(code);
  if (!report || !b || !b.inspection) return <NotFound />;
  const techName = byId(state.team, b.inspection.techId)?.name ?? "";
  return (
    <div className="min-h-dvh bg-slate-100 p-3 sm:p-6 print:bg-white print:p-0">
      <div className="mx-auto mb-3 flex max-w-[1100px] items-center justify-between gap-3 print:hidden">
        <Link href={`/r/${code}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600">
          <ChevronLeft className="size-4" /> Back to report
        </Link>
        <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">
          <Printer className="size-4" /> Print / Save PDF
        </button>
      </div>
      <InspectionSheet job={b.job} customer={b.customer} vehicle={b.vehicle} inspection={b.inspection} techName={techName} settings={state.settings} />
    </div>
  );
}
