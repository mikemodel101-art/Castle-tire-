import {
  CUSTOMERS,
  INSPECTIONS,
  JOBS,
  MEDIA,
  REPORTS,
  SUSPENSION_ITEMS,
  TEAM,
  VEHICLES,
  type BrakePosition,
  type CheckStatus,
  type Corner,
  type Customer,
  type Inspection,
  type Job,
  type Media,
  type Vehicle,
} from "./data";

// ---------- Status logic (mirrors the paper inspection sheet) ----------

/** Tread depth in 32nds: 6+ good, 4-5 monitor, under 4 replace. */
export function tireStatus(depth: number | null): CheckStatus {
  if (depth === null) return "pending";
  if (depth >= 6) return "green";
  if (depth >= 4) return "yellow";
  return "red";
}

/** Brake pad thickness in mm: 6+ good, 3-5.9 monitor, under 3 replace. */
export function padStatus(mm: number | null): CheckStatus {
  if (mm === null) return "pending";
  if (mm >= 6) return "green";
  if (mm >= 3) return "yellow";
  return "red";
}

/** Rotor thickness vs. minimum spec. */
export function rotorStatus(mm: number | null, min: number): CheckStatus {
  if (mm === null) return "pending";
  if (mm >= min + 2) return "green";
  if (mm >= min) return "yellow";
  return "red";
}

/** TPMS: target 35 psi. Within 2 psi good, within 5 monitor, sensor fault = red. */
export function tpmsStatus(psi: number | null, sensorOk: boolean, target = 35): CheckStatus {
  if (!sensorOk) return "red";
  if (psi === null) return "pending";
  const diff = Math.abs(psi - target);
  if (diff <= 2) return "green";
  if (diff <= 5) return "yellow";
  return "red";
}

/** Alignment: inside spec = green, within 0.5 outside = monitor, else red. */
export function rangeStatus(value: number | null, min: number, max: number, warn = 0.5): CheckStatus {
  if (value === null) return "pending";
  if (value >= min && value <= max) return "green";
  if (value >= min - warn && value <= max + warn) return "yellow";
  return "red";
}

/** Worst status wins. Returns pending only when every item is pending. */
export function worst(statuses: CheckStatus[]): CheckStatus {
  if (statuses.length === 0 || statuses.every((s) => s === "pending")) return "pending";
  if (statuses.includes("red")) return "red";
  if (statuses.includes("yellow")) return "yellow";
  return "green";
}

export function sectionStatuses(ins: Inspection) {
  const tires = worst(ins.tires.map((t) => tireStatus(t.treadDepth)));
  const brakes = worst(
    ins.brakes.flatMap((b) => [padStatus(b.padMm), rotorStatus(b.rotorMm, b.rotorMinMm)]),
  );
  const tpms = worst(ins.tpms.map((t) => tpmsStatus(t.psi, t.sensorOk)));
  const suspension = worst(ins.suspension.map((s) => s.status));
  const a = ins.alignment;
  const alignment = worst([
    rangeStatus(a.caster.value, a.caster.min, a.caster.max),
    rangeStatus(a.camber.value, a.camber.min, a.camber.max),
    rangeStatus(a.toe.value, a.toe.min, a.toe.max),
  ]);
  const overall = worst([tires, brakes, tpms, suspension, alignment]);
  return { tires, brakes, tpms, suspension, alignment, overall };
}

export function statusMeta(s: CheckStatus) {
  switch (s) {
    case "green":
      return {
        label: "Pass",
        badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
        dot: "bg-emerald-500",
        solid: "bg-emerald-500 text-white",
        bar: "bg-emerald-500",
      };
    case "yellow":
      return {
        label: "Monitor",
        badge: "bg-amber-50 text-amber-800 ring-amber-600/20",
        dot: "bg-amber-400",
        solid: "bg-amber-400 text-slate-900",
        bar: "bg-amber-400",
      };
    case "red":
      return {
        label: "Repair",
        badge: "bg-rose-50 text-rose-700 ring-rose-600/20",
        dot: "bg-rose-500",
        solid: "bg-rose-500 text-white",
        bar: "bg-rose-500",
      };
    default:
      return {
        label: "Pending",
        badge: "bg-slate-100 text-slate-600 ring-slate-500/20",
        dot: "bg-slate-300",
        solid: "bg-slate-300 text-slate-700",
        bar: "bg-slate-300",
      };
  }
}

// ---------- Lookups ----------

export const findCustomer = (id: string): Customer | undefined => CUSTOMERS.find((c) => c.id === id);
export const findVehicle = (id: string): Vehicle | undefined => VEHICLES.find((v) => v.id === id);
export const findJob = (id: string): Job | undefined => JOBS.find((j) => j.id === id);
export const findMember = (id: string | null) => (id ? TEAM.find((m) => m.id === id) : undefined);
export const findInspectionByJob = (jobId: string): Inspection | undefined =>
  INSPECTIONS.find((i) => i.jobId === jobId);
export const findReport = (id: string) => REPORTS.find((r) => r.id === id);
export const vehiclesOf = (customerId: string) => VEHICLES.filter((v) => v.customerId === customerId);
export const jobsOfCustomer = (customerId: string) =>
  JOBS.filter((j) => j.customerId === customerId).sort((a, b) => b.date.localeCompare(a.date));
export const mediaOfJob = (jobId: string): Media[] => MEDIA.filter((m) => m.jobId === jobId);
export const mediaOfVehicle = (vehicleId: string): Media[] => MEDIA.filter((m) => m.vehicleId === vehicleId);

export function customerForJob(job: Job): Customer | undefined {
  return job.adHoc?.customer ?? findCustomer(job.customerId);
}

export function vehicleForJob(job: Job): Vehicle | undefined {
  return job.adHoc?.vehicle ?? findVehicle(job.vehicleId);
}

/** Returns the stored inspection for a job, or a blank template for a new one. */
export function inspectionForJob(job: Job): Inspection {
  const existing = findInspectionByJob(job.id);
  if (existing) return existing;
  const corners: Corner[] = ["LF", "RF", "LR", "RR"];
  const brakePositions: BrakePosition[] = ["Front Left", "Front Right", "Rear Left", "Rear Right"];
  return {
    id: `INS-${job.id}`,
    jobId: job.id,
    technicianId: job.assignedTo,
    date: job.date,
    tires: corners.map((position) => ({ position, brand: "", size: "", treadDepth: null, psi: null })),
    brakes: brakePositions.map((position) => ({
      position,
      padMm: null,
      rotorMm: null,
      rotorMinMm: position.startsWith("Front") ? 22 : 8,
    })),
    tpms: corners.map((position) => ({ position, psi: null, sensorOk: true })),
    suspension: SUSPENSION_ITEMS.map((item) => ({ item, status: "pending", note: "" })),
    alignment: {
      caster: { value: null, min: 1.5, max: 3.0 },
      camber: { value: null, min: -1.0, max: 0.0 },
      toe: { value: null, min: -0.1, max: 0.2 },
    },
    notes: "",
    recommendations: [],
  };
}

// ---------- Formatting ----------

export function formatDate(iso: string) {
  return new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export const vehicleLabel = (v: Vehicle) => `${v.year} ${v.make} ${v.model}`;
export const money = (n: number) => `$${n.toLocaleString("en-US")}`;
export const fmtTread = (n: number | null) => (n === null ? "—" : `${n}/32"`);
export const fmtNum = (n: number | null, digits = 1) => (n === null ? "—" : n.toFixed(digits));

/** Opens the phone's messaging app with a prefilled text. */
export function smsLink(phone: string, body: string) {
  const digits = phone.replace(/\D/g, "");
  const full = digits.length === 10 ? `1${digits}` : digits;
  return `sms:+${full}?body=${encodeURIComponent(body)}`;
}

export function telLink(phone: string) {
  return `tel:+1${phone.replace(/\D/g, "").slice(-10)}`;
}

export function overallSummary(ins: Inspection) {
  const s = sectionStatuses(ins);
  const counts = { red: 0, yellow: 0 };
  ins.recommendations.forEach((r) => {
    if (r.severity === "red") counts.red += 1;
    if (r.severity === "yellow") counts.yellow += 1;
  });
  return { ...s, counts, total: ins.recommendations.reduce((sum, r) => sum + r.estimate, 0) };
}
