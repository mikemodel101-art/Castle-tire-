import {
  CAR_PHOTOS,
  CORNERS,
  JOB_STATUSES,
  SUMMARY_ORDER,
  type Corner,
  type Estimate,
  type EstimateLine,
  type Grade,
  type Inspection,
  type JobStatus,
  type Light,
  type OkRec,
  type Priority,
  type RotorGrade,
  type Section,
  type Settings,
  type ShopState,
  type SuspensionPart,
  type TireCorner,
  type Vehicle,
} from "./data";

// ---------- Dates (all local time, ISO strings without timezone) ----------

export const pad2 = (n: number) => String(n).padStart(2, "0");
export const toISODate = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
export const todayISO = () => toISODate(new Date());

export function nowISO() {
  const d = new Date();
  return `${toISODate(d)}T${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

export function parseLocal(s: string): Date {
  const [datePart, timePart] = s.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  if (!timePart) return new Date(y, (m || 1) - 1, d || 1, 12);
  const [hh, mm, ss] = timePart.split(":").map((x) => Number.parseInt(x, 10));
  return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, ss || 0);
}

export function addDays(iso: string, n: number) {
  const d = parseLocal(iso.slice(0, 10));
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

export function daysBetween(a: string, b: string) {
  return Math.round((parseLocal(b.slice(0, 10)).getTime() - parseLocal(a.slice(0, 10)).getTime()) / 86_400_000);
}

const ISO_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?)?$/;

/** Moves every ISO date/time string inside a JSON value by `days`. Keeps the demo anchored on "today". */
export function shiftDates<T>(value: T, days: number): T {
  if (days === 0) return value;
  if (typeof value === "string") {
    if (!ISO_RE.test(value)) return value;
    return (value.length === 10 ? addDays(value, days) : `${addDays(value.slice(0, 10), days)}${value.slice(10)}`) as T;
  }
  if (Array.isArray(value)) return value.map((v) => shiftDates(v, days)) as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = shiftDates(v, days);
    return out as T;
  }
  return value;
}

export function fmtDate(
  s: string,
  opts: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric", year: "numeric" },
) {
  return parseLocal(s).toLocaleDateString("en-US", opts);
}
export const fmtShortDate = (s: string) => fmtDate(s, { month: "short", day: "numeric", year: "numeric" });
export const fmtTime = (s: string) => parseLocal(s).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
export const fmtDateTime = (s: string) => `${fmtShortDate(s)}, ${fmtTime(s)}`;

export function relDay(s: string, today: string) {
  const d = daysBetween(today, s.slice(0, 10));
  if (d === 0) return "Today";
  if (d === -1) return "Yesterday";
  if (d === 1) return "Tomorrow";
  return fmtShortDate(s);
}

export function relStamp(s: string, today: string) {
  const day = relDay(s, today);
  return s.length > 10 ? `${day} ${fmtTime(s)}` : day;
}

/** "01:30 PM" -> minutes since midnight, used to sort the schedule. */
export function slotMinutes(t: string) {
  const m = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return 0;
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === "PM") h += 12;
  return h * 60 + Number(m[2]);
}

export function timeSlotNow() {
  const d = new Date();
  const h = d.getHours();
  const suffix = h >= 12 ? "PM" : "AM";
  return `${pad2(h % 12 === 0 ? 12 : h % 12)}:${pad2(d.getMinutes())} ${suffix}`;
}

// ---------- Formatting ----------

export function money(n: number, cents = false) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  });
}

export const vehicleLabel = (v: Pick<Vehicle, "year" | "make" | "model">) => `${v.year} ${v.make} ${v.model}`;
export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0].toUpperCase())
    .slice(0, 2)
    .join("");
export const digits = (s: string) => s.replace(/\D/g, "");
export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;
export const fmtMiles = (n: number) => `${n.toLocaleString("en-US")} mi`;

export function formatPhone(input: string) {
  const d = digits(input).slice(-10);
  if (d.length < 10) return input.trim();
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

/** Opens the device's messaging app with a pre-filled text (works on iPhone and Android). */
export function smsHref(phone: string, body: string) {
  const d = digits(phone);
  const num = d.length === 10 ? `+1${d}` : d ? `+${d}` : "";
  return `sms:${num}?&body=${encodeURIComponent(body)}`;
}

export const telHref = (phone: string) => `tel:+1${digits(phone).slice(-10)}`;

export function fillTemplate(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{(\w+)\}/g, (match, key: string) => vars[key] ?? match);
}

export function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export function numOrNull(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function defaultCarPhoto(make: string, model: string) {
  const m = `${make} ${model}`.toLowerCase();
  if (/tesla|model [3sxy]\b/.test(m)) return CAR_PHOTOS.ev;
  if (/f-150|f150|silverado|\bram\b|tacoma|tundra|sierra|ranger|colorado|frontier|ridgeline|gladiator|1500|2500/.test(m))
    return CAR_PHOTOS.truck;
  if (/jeep|wrangler|bronco/.test(m)) return CAR_PHOTOS.jeep;
  if (/sienna|odyssey|pacifica|caravan|transit|promaster|van/.test(m)) return CAR_PHOTOS.suvGarage;
  if (
    /rav4|cr-v|crv|pilot|outback|highlander|explorer|escape|rogue|cx-|tucson|santa fe|forester|4runner|equinox|tahoe|traverse|sorento|sportage|telluride|tiguan|atlas|x3|x5|ascent|crosstrek|pathfinder|murano|edge|kona|hr-v|compass|cherokee/.test(
      m,
    )
  )
    return CAR_PHOTOS.suv;
  return CAR_PHOTOS.sedan;
}

export const vehiclePhoto = (v: Vehicle) => v.photo ?? defaultCarPhoto(v.make, v.model);

// ---------- Job status ----------

export const statusIndex = (s: JobStatus) => JOB_STATUSES.indexOf(s);
export type JobGroup = "waiting" | "progress" | "completed";
export const jobGroup = (s: JobStatus): JobGroup =>
  s === "waiting" ? "waiting" : s === "completed" ? "completed" : "progress";

// ---------- Inspection logic (mirrors the paper inspection sheet) ----------

export function blankInspection(jobId: string, techId: string | null = null): Inspection {
  const corner = (): TireCorner => ({ tread: null, grade: null });
  return {
    jobId,
    techId,
    startedAt: null,
    completedAt: null,
    tireSize: "",
    tireBrand: "",
    tires: { LF: corner(), RF: corner(), LR: corner(), RR: corner() },
    brakes: { front: { pad: null, rotor: null }, rear: { pad: null, rotor: null } },
    tpms: { status: null, tpmNumber: "", psi: { LF: null, RF: null, LR: null, RR: null } },
    suspension: { status: null, parts: [], other: "" },
    alignment: { status: null, package: null },
    notes: { tires: "", brakes: "", suspension: "", alignment: "", tpms: "" },
    additionalNotes: "",
    recommended: { tires: null, brakes: null, suspension: null, alignment: null, tpms: null },
  };
}

/** Tread in 32nds: above "soon" = Good, at/below soon = Soon, at/below replace = Replace. */
export function autoTireGrade(tread: number | null, s: Settings): Grade | null {
  if (tread === null || Number.isNaN(tread)) return null;
  if (tread <= s.treadReplace) return "replace";
  if (tread <= s.treadSoon) return "soon";
  return "good";
}

/** Brake pad thickness in mm, same banding as tread. */
export function padGrade(mm: number | null, s: Settings): Grade | null {
  if (mm === null || Number.isNaN(mm)) return null;
  if (mm <= s.padReplace) return "replace";
  if (mm <= s.padSoon) return "soon";
  return "good";
}

export const tireGradeOf = (c: TireCorner, s: Settings): Grade | null => c.grade ?? autoTireGrade(c.tread, s);

export const GRADE_LIGHT: Record<Grade, Light> = { good: "green", soon: "yellow", replace: "red" };
export const ROTOR_LIGHT: Record<RotorGrade, Light> = { good: "green", worn: "yellow", replace: "red" };
export const PRIORITY_LIGHT: Record<Priority, Light> = { ok: "green", future: "blue", soon: "yellow", now: "red" };
const okRecLight = (v: OkRec | null): Light => (v === "ok" ? "green" : v === "rec" ? "yellow" : "none");

const RANK: Record<Light, number> = { none: 0, green: 1, blue: 2, yellow: 3, red: 4 };
export const worstLight = (lights: Light[]): Light =>
  lights.reduce<Light>((w, l) => (RANK[l] > RANK[w] ? l : w), "none");

export function axleLight(ins: Inspection, axle: "front" | "rear", s: Settings): Light {
  const a = ins.brakes[axle];
  const pg = padGrade(a.pad, s);
  return worstLight([pg ? GRADE_LIGHT[pg] : "none", a.rotor ? ROTOR_LIGHT[a.rotor] : "none"]);
}

export function measuredLight(ins: Inspection, section: Section, s: Settings): Light {
  switch (section) {
    case "tires":
      return worstLight(
        CORNERS.map((c) => {
          const g = tireGradeOf(ins.tires[c], s);
          return g ? GRADE_LIGHT[g] : "none";
        }),
      );
    case "brakes":
      return worstLight([axleLight(ins, "front", s), axleLight(ins, "rear", s)]);
    case "tpms":
      return okRecLight(ins.tpms.status);
    case "suspension":
      return okRecLight(ins.suspension.status);
    case "alignment":
      return okRecLight(ins.alignment.status);
  }
}

export function suggestedPriority(ins: Inspection, section: Section, s: Settings): Priority | null {
  const light = measuredLight(ins, section, s);
  if (light === "red") return "now";
  if (light === "yellow") return "soon";
  if (light === "green") return "ok";
  return null;
}

/** The technician's choice on the "Recommended repairs" grid, or a suggestion from the measurements. */
export const effectivePriority = (ins: Inspection, section: Section, s: Settings): Priority | null =>
  ins.recommended[section] ?? suggestedPriority(ins, section, s);

export function sectionChip(ins: Inspection, section: Section, s: Settings): { light: Light; label: string } {
  const p = effectivePriority(ins, section, s);
  if (!p) return { light: "none", label: "Not checked" };
  if (p === "ok") return { light: "green", label: "Good" };
  if (p === "future") return { light: "blue", label: "Future" };
  if (p === "soon") return { light: "yellow", label: "Soon" };
  return { light: "red", label: section === "tires" || section === "brakes" ? "Replace" : "Recommended" };
}

export function sectionNote(ins: Inspection, section: Section): string {
  const note = ins.notes[section].trim();
  if (note) return note;
  switch (section) {
    case "tires": {
      const parts = CORNERS.filter((c) => ins.tires[c].tread !== null).map((c) => `${c} ${ins.tires[c].tread}/32`);
      return parts.length ? parts.join(" · ") : "Not measured yet";
    }
    case "brakes": {
      const out: string[] = [];
      if (ins.brakes.front.pad !== null) out.push(`Front pads ${ins.brakes.front.pad} mm`);
      if (ins.brakes.rear.pad !== null) out.push(`Rear pads ${ins.brakes.rear.pad} mm`);
      return out.join(" · ") || "Not measured yet";
    }
    case "tpms":
      if (ins.tpms.status === "ok") return "No issues";
      if (ins.tpms.status === "rec") return `Service recommended${ins.tpms.tpmNumber ? ` · TPM # ${ins.tpms.tpmNumber}` : ""}`;
      return "Not checked yet";
    case "suspension": {
      if (ins.suspension.status === "ok") return "No issues";
      const parts = ins.suspension.parts.map((p) => (p === "Other" && ins.suspension.other ? ins.suspension.other : p));
      if (parts.length) return parts.join(", ");
      return ins.suspension.status === "rec" ? "Service recommended" : "Not checked yet";
    }
    case "alignment":
      if (ins.alignment.status === "ok") return "Within spec";
      if (ins.alignment.status === "rec")
        return `Alignment recommended${ins.alignment.package ? ` (ALG ${ins.alignment.package})` : ""}`;
      return "Not checked yet";
  }
}

export const overallLight = (ins: Inspection, s: Settings): Light =>
  worstLight(SUMMARY_ORDER.map((sec) => sectionChip(ins, sec, s).light));

export function inspectionProgress(ins: Inspection | undefined, s: Settings) {
  if (!ins) return 0;
  const done = SUMMARY_ORDER.filter((sec) => measuredLight(ins, sec, s) !== "none").length;
  return Math.round((done / SUMMARY_ORDER.length) * 100);
}

export const LIGHT_META: Record<Light, { chip: string; dot: string; solid: string; fill: string; ring: string }> = {
  green: {
    chip: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    dot: "bg-emerald-500",
    solid: "bg-emerald-500 text-white",
    fill: "#10b981",
    ring: "ring-emerald-500",
  },
  blue: {
    chip: "bg-sky-50 text-sky-700 ring-sky-600/20",
    dot: "bg-sky-500",
    solid: "bg-sky-500 text-white",
    fill: "#0ea5e9",
    ring: "ring-sky-500",
  },
  yellow: {
    chip: "bg-amber-50 text-amber-800 ring-amber-500/30",
    dot: "bg-amber-400",
    solid: "bg-amber-400 text-slate-950",
    fill: "#f59e0b",
    ring: "ring-amber-400",
  },
  red: {
    chip: "bg-red-50 text-red-700 ring-red-600/20",
    dot: "bg-red-500",
    solid: "bg-red-600 text-white",
    fill: "#ef4444",
    ring: "ring-red-500",
  },
  none: {
    chip: "bg-slate-100 text-slate-500 ring-slate-400/20",
    dot: "bg-slate-300",
    solid: "bg-slate-200 text-slate-600",
    fill: "#1f2937",
    ring: "ring-slate-300",
  },
};

// ---------- Estimates ----------

const SUSPENSION_PRICE: Record<SuspensionPart, [number, number]> = {
  "Inner Tie Rod": [95, 120],
  "Outer Tie Rod": [75, 110],
  "Control Arm": [180, 160],
  Shock: [120, 90],
  Strut: [210, 180],
  Other: [0, 95],
};

/** Builds estimate lines from the inspection's recommended repairs (parts / labor price book). */
export function buildEstimateLines(ins: Inspection, s: Settings, nextId: () => string): EstimateLine[] {
  const lines: EstimateLine[] = [];
  const add = (section: EstimateLine["section"], description: string, priority: Priority, parts: number, labor: number) =>
    lines.push({ id: nextId(), section, description, priority, parts, labor, decision: "pending" });

  for (const section of SUMMARY_ORDER) {
    const p = effectivePriority(ins, section, s);
    if (!p || p === "ok") continue;

    if (section === "tires") {
      const grades = CORNERS.map((c) => tireGradeOf(ins.tires[c], s));
      let count = grades.filter((g) => g === "replace").length;
      if (count === 0) count = grades.filter((g) => g === "soon").length;
      if (count === 0) count = 2;
      if (count === 3) count = 4;
      add("tires", `Replace ${count} tires${ins.tireSize ? ` (${ins.tireSize})` : ""} · mount, balance & disposal`, p, 165 * count, 25 * count);
    }

    if (section === "brakes") {
      const before = lines.length;
      for (const axle of ["front", "rear"] as const) {
        const a = ins.brakes[axle];
        const pg = padGrade(a.pad, s);
        const rotor = a.rotor === "replace" || a.rotor === "worn";
        const pads = pg === "replace" || pg === "soon";
        const name = axle === "front" ? "Front" : "Rear";
        if (rotor) add("brakes", `${name} brake pads & rotors`, p, axle === "front" ? 260 : 220, axle === "front" ? 180 : 160);
        else if (pads) add("brakes", `${name} brake pads`, p, axle === "front" ? 95 : 85, axle === "front" ? 120 : 110);
      }
      if (lines.length === before) add("brakes", "Brake service & inspection", p, 0, 95);
    }

    if (section === "alignment") {
      const price = ins.alignment.package ?? 89;
      const label = s.alignmentPackages.find((a) => a.price === price)?.label ?? "Wheel alignment";
      add("alignment", `${label} (ALG ${price})`, p, 0, price);
    }

    if (section === "tpms") {
      const tpm = ins.tpms.tpmNumber.trim();
      if (tpm) add("tpms", `TPMS sensor replacement (TPM # ${tpm})`, p, 55, 30);
      else add("tpms", "TPMS service kit & sensor relearn", p, 12, 35);
    }

    if (section === "suspension") {
      if (ins.suspension.parts.length === 0) add("suspension", "Suspension diagnosis", p, 0, 95);
      for (const part of ins.suspension.parts) {
        const [parts, labor] = SUSPENSION_PRICE[part];
        const label = part === "Other" ? ins.suspension.other.trim() || "Other suspension repair" : `Replace ${part.toLowerCase()}`;
        add("suspension", label, p, parts, labor);
      }
    }
  }
  return lines;
}

export function estimateTotals(e: Estimate, taxRate: number, onlyApproved = false) {
  const lines = e.lines.filter((l) => (onlyApproved ? l.decision === "approved" : l.decision !== "declined"));
  const parts = lines.reduce((sum, l) => sum + (Number(l.parts) || 0), 0);
  const labor = lines.reduce((sum, l) => sum + (Number(l.labor) || 0), 0);
  const tax = Math.round(parts * taxRate) / 100;
  return { parts, labor, tax, total: parts + labor + tax };
}

// ---------- Lookups ----------

export const byId = <T extends { id: string }>(list: T[], id: string | null | undefined) =>
  id ? list.find((x) => x.id === id) : undefined;

export function jobBundle(state: ShopState, jobId: string) {
  const job = state.jobs.find((j) => j.id === jobId);
  if (!job) return null;
  const customer = byId(state.customers, job.customerId);
  const vehicle = byId(state.vehicles, job.vehicleId);
  if (!customer || !vehicle) return null;
  return {
    job,
    customer,
    vehicle,
    tech: byId(state.team, job.assignedTo),
    inspection: state.inspections.find((i) => i.jobId === jobId),
    report: state.reports.find((r) => r.jobId === jobId),
    estimate: state.estimates.find((e) => e.jobId === jobId),
    media: state.media.filter((m) => m.jobId === jobId),
  };
}

export type JobBundle = NonNullable<ReturnType<typeof jobBundle>>;

export const cornerLights = (ins: Inspection | undefined, s: Settings): Partial<Record<Corner, Light>> => {
  if (!ins) return {};
  const out: Partial<Record<Corner, Light>> = {};
  for (const c of CORNERS) {
    const g = tireGradeOf(ins.tires[c], s);
    if (g) out[c] = GRADE_LIGHT[g];
  }
  return out;
};
