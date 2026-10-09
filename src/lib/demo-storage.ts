// Validate persisted dummy data BEFORE any page reads it.
// TypeScript types do not validate JSON from an older version or another tab.
// No database or external service is used here.

import {
  JOB_STATUSES,
  MEDIA_SECTIONS,
  PRIORITIES,
  SUMMARY_ORDER,
  CORNERS,
  SUSPENSION_PARTS,
  type Customer,
  type Vehicle,
  type Member,
  type Job,
  type Inspection,
  type Media,
  type Report,
  type Estimate,
  type Message,
  type ExpenseTransaction,
  type Settings,
  type ShopState,
} from "./data";
import { createSeed, STORE_VERSION } from "./seed";
import { daysBetween, shiftDates } from "./utils";

export const DEMO_STORAGE_KEY = "castle-tire-demo-v4";
export const LEGACY_DEMO_STORAGE_KEY = "castle-tire-demo-v3";
export const DEMO_BACKUP_KEY = "castle-tire-demo-recovery-backup";

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const isString = (v: unknown): v is string => typeof v === "string";
const hasId = (v: unknown): v is string => isString(v) && v.trim().length > 0;
const optionalString = (v: unknown) => v === undefined || isString(v);
const nullableString = (v: unknown) => v === null || isString(v);
const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const positiveOrZero = (v: unknown) => finite(v) && v >= 0;
const nullableNumber = (v: unknown) => v === null || positiveOrZero(v);
const oneOf = <T extends string | number>(v: unknown, options: readonly T[]): v is T =>
  options.includes(v as T);
const nullableEnum = <T extends string | number>(v: unknown, options: readonly T[]) =>
  v === null || oneOf(v, options);

/** Only accept real calendar dates, not "2026-99-99" or an invalid Date. */
export function validDay(v: unknown): boolean {
  if (!isString(v) || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const date = new Date(`${v}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === v;
}

function validStamp(v: unknown): v is string {
  if (!isString(v)) return false;
  if (validDay(v)) return true;
  const match = v.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
  return Boolean(
    match && validDay(match[1]) && Number(match[2]) < 24 && Number(match[3]) < 60 && Number(match[4] ?? 0) < 60,
  );
}
const nullableStamp = (v: unknown) => v === null || validStamp(v);
const stringFields = (v: Record<string, unknown>, keys: string[]) => keys.every((k) => isString(v[k]));

function isMember(v: unknown): v is Member {
  return isObject(v) && hasId(v.id) && stringFields(v, ["name", "role", "initials"]);
}
function isCustomer(v: unknown): v is Customer {
  return isObject(v) && hasId(v.id) && stringFields(v, ["name", "phone", "email", "city", "since"]);
}
function isVehicle(v: unknown): v is Vehicle {
  return isObject(v) && hasId(v.id) && hasId(v.customerId) && positiveOrZero(v.year) && positiveOrZero(v.mileage) &&
    stringFields(v, ["make", "model", "trim", "color", "plate", "vin"]) && optionalString(v.photo);
}
function isJob(v: unknown): v is Job {
  return isObject(v) && hasId(v.id) && hasId(v.customerId) && hasId(v.vehicleId) && validDay(v.date) &&
    isString(v.time) && /^(0?[1-9]|1[0-2]):[0-5]\d\s*(AM|PM)$/i.test(v.time) && isString(v.complaint) &&
    oneOf(v.status, JOB_STATUSES) && nullableString(v.assignedTo) && positiveOrZero(v.mileageIn) &&
    Array.isArray(v.timeline) && v.timeline.every((t: unknown) =>
      isObject(t) && oneOf(t.status, JOB_STATUSES) && validStamp(t.at) && isString(t.by));
}
function isInspection(v: unknown): v is Inspection {
  if (!isObject(v) || !hasId(v.jobId) || !nullableString(v.techId) || !nullableStamp(v.startedAt) ||
      !nullableStamp(v.completedAt) || !isString(v.tireSize) || !isString(v.tireBrand) || !isString(v.additionalNotes)) return false;
  const tires = v.tires;
  const brakes = v.brakes;
  const tpms = v.tpms;
  const suspension = v.suspension;
  const alignment = v.alignment;
  const notes = v.notes;
  const recommended = v.recommended;
  if (!isObject(tires) || !CORNERS.every((c) => {
    const t = tires[c];
    return isObject(t) && nullableNumber(t.tread) && nullableEnum(t.grade, ["good", "soon", "replace"]);
  })) return false;
  if (!isObject(brakes) || !["front", "rear"].every((a) => {
    const b = brakes[a];
    return isObject(b) && nullableNumber(b.pad) && nullableEnum(b.rotor, ["good", "worn", "replace"]);
  })) return false;
  if (!isObject(tpms) || !nullableEnum(tpms.status, ["ok", "rec"]) || !isString(tpms.tpmNumber) ||
      !isObject(tpms.psi) || !CORNERS.every((c) => nullableNumber((tpms.psi as Record<string, unknown>)[c]))) return false;
  if (!isObject(suspension) || !nullableEnum(suspension.status, ["ok", "rec"]) || !isString(suspension.other) ||
      !Array.isArray(suspension.parts) || !suspension.parts.every((p: unknown) => oneOf(p, SUSPENSION_PARTS))) return false;
  if (!isObject(alignment) || !nullableEnum(alignment.status, ["ok", "rec"]) ||
      !nullableEnum(alignment.package, [79, 89, 99, 120])) return false;
  return isObject(notes) && SUMMARY_ORDER.every((s) => isString(notes[s])) &&
    isObject(recommended) && SUMMARY_ORDER.every((s) => nullableEnum(recommended[s], PRIORITIES));
}
function isMedia(v: unknown): v is Media {
  return isObject(v) && hasId(v.id) && hasId(v.jobId) && hasId(v.vehicleId) && oneOf(v.section, MEDIA_SECTIONS) &&
    oneOf(v.type, ["photo", "video"]) && isString(v.url) && optionalString(v.poster) && optionalString(v.item) &&
    isString(v.caption) && validStamp(v.takenAt) && isString(v.by);
}
function isReport(v: unknown): v is Report {
  return isObject(v) && hasId(v.code) && hasId(v.jobId) && validStamp(v.createdAt) && nullableStamp(v.sentAt);
}
function isEstimate(v: unknown): v is Estimate {
  return isObject(v) && hasId(v.id) && hasId(v.jobId) && validStamp(v.createdAt) && nullableStamp(v.sentAt) &&
    nullableStamp(v.approvedAt) && oneOf(v.status, ["draft", "sent", "approved", "declined"]) &&
    Array.isArray(v.lines) && v.lines.every((l: unknown) => isObject(l) && hasId(l.id) &&
      oneOf(l.section, [...SUMMARY_ORDER, "other"]) && isString(l.description) && oneOf(l.priority, PRIORITIES) &&
      positiveOrZero(l.parts) && positiveOrZero(l.labor) && oneOf(l.decision, ["pending", "approved", "declined"]));
}
function isMessage(v: unknown): v is Message {
  return isObject(v) && hasId(v.id) && hasId(v.customerId) && optionalString(v.jobId) &&
    oneOf(v.direction, ["out", "in"]) && isString(v.body) && validStamp(v.at) &&
    oneOf(v.kind, ["text", "report", "estimate"]) && optionalString(v.link) && optionalString(v.by);
}
function isExpense(v: unknown): v is ExpenseTransaction {
  return isObject(v) && hasId(v.id) && validDay(v.date) && validStamp(v.at) && oneOf(v.type, ["income", "expense"]) &&
    stringFields(v, ["category", "description", "by"]) && positiveOrZero(v.amount) &&
    oneOf(v.method, ["cash", "card", "check", "bank", "other"]) && optionalString(v.jobId);
}
function isSettings(v: unknown): v is Settings {
  return isObject(v) && stringFields(v, ["shopName", "phone", "address", "hours", "website", "reportTemplate", "estimateTemplate"]) &&
    ["treadSoon", "treadReplace", "padSoon", "padReplace", "taxRate"].every((k) => positiveOrZero(v[k])) &&
    Array.isArray(v.alignmentPackages) && v.alignmentPackages.every((p: unknown) =>
      isObject(p) && oneOf(p.price, [79, 89, 99, 120]) && isString(p.label));
}

type Identified = { id: string } | { jobId: string } | { code: string };
const keyOf = (v: Identified) => "id" in v ? v.id : "code" in v ? v.code : v.jobId;

/** Repair invalid/missing collections independently instead of blindly trusting a JSON cast. */
export function normalizeDemoState(raw: unknown, today: string): { state: ShopState; repaired: boolean; migrated: boolean } {
  if (!isObject(raw) || !oneOf(raw.version, [3, STORE_VERSION])) {
    return { state: createSeed(today), repaired: true, migrated: false };
  }
  let repaired = !validDay(raw.anchorDay);
  const anchorDay = isString(raw.anchorDay) && validDay(raw.anchorDay) ? raw.anchorDay : today;
  const seed = createSeed(anchorDay);
  const migrated = raw.version !== STORE_VERSION;

  const collection = <T extends Identified>(value: unknown, defaults: T[], guard: (v: unknown) => v is T): T[] => {
    if (!Array.isArray(value)) {
      repaired = true;
      return defaults;
    }
    const seen = new Set<string>();
    const list: T[] = [];
    for (const entry of value) {
      // A known damaged row can be recovered from its seeded counterpart.
      let row: T | undefined;
      if (guard(entry)) row = entry;
      else {
        repaired = true;
        const id = isObject(entry) ? (entry.id ?? entry.code ?? entry.jobId) : undefined;
        row = defaults.find((d) => keyOf(d) === id);
      }
      if (!row || seen.has(keyOf(row))) { repaired = true; continue; }
      seen.add(keyOf(row));
      list.push(row);
    }
    return list;
  };

  const result: ShopState = {
    version: STORE_VERSION,
    anchorDay,
    seq: positiveOrZero(raw.seq) ? Math.max(600, Math.floor(raw.seq as number)) : 600,
    settings: isSettings(raw.settings) ? raw.settings : seed.settings,
    team: collection(raw.team, seed.team, isMember),
    customers: collection(raw.customers, seed.customers, isCustomer),
    vehicles: collection(raw.vehicles, seed.vehicles, isVehicle),
    jobs: collection(raw.jobs, seed.jobs, isJob),
    inspections: collection(raw.inspections, seed.inspections, isInspection),
    media: collection(raw.media, seed.media, isMedia),
    reports: collection(raw.reports, seed.reports, isReport),
    estimates: collection(raw.estimates, seed.estimates, isEstimate),
    messages: collection(raw.messages, seed.messages, isMessage),
    // A healthy v3 save gains expenses without being called corrupt.
    expenses: migrated && raw.expenses === undefined ? seed.expenses : collection(raw.expenses, seed.expenses, isExpense),
  };
  if (!isSettings(raw.settings) || !positiveOrZero(raw.seq)) repaired = true;

  // Session-only blob URLs are expected to expire when the document reloads.
  result.media = result.media.filter((m) => !m.url.startsWith("blob:"));

  const customers = new Set(result.customers.map((c) => c.id));
  const linked = <T>(values: T[], predicate: (v: T) => boolean): T[] => {
    const valid = values.filter(predicate);
    if (valid.length !== values.length) repaired = true;
    return valid;
  };
  result.vehicles = linked(result.vehicles, (v) => customers.has(v.customerId));
  const validVehicles = new Set(result.vehicles.map((v) => v.id));
  result.jobs = linked(result.jobs, (j) => customers.has(j.customerId) && validVehicles.has(j.vehicleId));
  const validJobs = new Set(result.jobs.map((j) => j.id));
  result.inspections = linked(result.inspections, (i) => validJobs.has(i.jobId));
  result.media = linked(result.media, (m) => validJobs.has(m.jobId) && validVehicles.has(m.vehicleId));
  result.reports = linked(result.reports, (r) => validJobs.has(r.jobId));
  result.estimates = linked(result.estimates, (e) => validJobs.has(e.jobId));
  result.messages = linked(result.messages, (m) => customers.has(m.customerId));
  // Keep bookkeeping entries even if their optional job no longer exists.
  result.expenses = result.expenses.map((x) => x.jobId && !validJobs.has(x.jobId) ? { ...x, jobId: undefined } : x);

  const ids = [...result.customers, ...result.vehicles, ...result.team, ...result.media, ...result.messages, ...result.expenses];
  result.seq = Math.max(result.seq, ...ids.map((r) => Number(r.id.replace(/\D/g, "")) || 0));
  const shifted = anchorDay === today ? result : shiftDates(result, daysBetween(anchorDay, today));
  return { state: { ...shifted, anchorDay: today }, repaired, migrated };
}
