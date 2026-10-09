"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import type {
  Estimate,
  ExpenseTransaction,
  Inspection,
  Job,
  JobStatus,
  Media,
  Member,
  Message,
  Settings,
  ShopState,
} from "./data";
import { createSeed } from "./seed";
import { DEMO_STORAGE_KEY, LEGACY_DEMO_STORAGE_KEY, DEMO_BACKUP_KEY, normalizeDemoState } from "./demo-storage";
import {
  blankInspection,
  buildEstimateLines,
  digits,
  formatPhone,
  initials,
  makeCode,
  nowISO,
  statusIndex,
  todayISO,
} from "./utils";

// Demo persistence only: never open a database or depend on environment variables.
let state: ShopState | null = null;
const listeners = new Set<() => void>();
let storageBound = false;
let lastSaveOk = true;
let persistenceNotice: "recovered" | "migrated" | "session" | null = null;

function writeStorage(key: string, value: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function backupDamagedSave(raw: string) {
  try {
    if (!window.localStorage.getItem(DEMO_BACKUP_KEY)) writeStorage(DEMO_BACKUP_KEY, raw);
  } catch {
    // Restricted storage must not stop the in-memory demo from running.
  }
}

function decodeSave(raw: string): ShopState {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = null;
  }
  const normalized = normalizeDemoState(parsed, todayISO());
  if (normalized.repaired) {
    backupDamagedSave(raw);
    persistenceNotice = "recovered";
  } else if (normalized.migrated) {
    persistenceNotice = "migrated";
  }
  if (normalized.repaired || normalized.migrated) {
    lastSaveOk = writeStorage(DEMO_STORAGE_KEY, JSON.stringify(normalized.state));
    if (!lastSaveOk) persistenceNotice = "session";
  }
  return normalized.state;
}

function load(): ShopState {
  if (typeof window === "undefined") return createSeed(todayISO());
  try {
    const raw = window.localStorage.getItem(DEMO_STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_DEMO_STORAGE_KEY);
    return raw ? decodeSave(raw) : createSeed(todayISO());
  } catch {
    lastSaveOk = false;
    persistenceNotice = "session";
    return createSeed(todayISO());
  }
}

function getSnapshot(): ShopState {
  // Never cache a visitor's state in the server process or touch window during SSR.
  if (typeof window === "undefined") return createSeed(todayISO());
  if (!state) state = load();
  return state;
}

function getServerSnapshot(): ShopState | null {
  return null;
}

function emit() {
  listeners.forEach((l) => l());
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function flush() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  if (!state || typeof window === "undefined") return;
  const previous = lastSaveOk;
  lastSaveOk = writeStorage(DEMO_STORAGE_KEY, JSON.stringify(state));
  if (!lastSaveOk) persistenceNotice = "session";
  if (previous !== lastSaveOk) emit();
}

function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(flush, 200);
}

function bindStorage() {
  if (storageBound || typeof window === "undefined") return;
  storageBound = true;
  window.addEventListener("storage", (e) => {
    if (e.key !== DEMO_STORAGE_KEY && e.key !== null) return;
    // Validate cross-tab writes too: another tab can contain an old/partial save.
    state = e.newValue ? decodeSave(e.newValue) : createSeed(todayISO());
    emit();
  });
  window.addEventListener("pagehide", flush);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
}

function subscribe(cb: () => void) {
  bindStorage();
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function setState(fn: (s: ShopState) => ShopState) {
  state = fn(getSnapshot());
  bindStorage();
  scheduleSave();
  emit();
}

export const storageHealthy = () => lastSaveOk;

export function usePersistenceNotice() {
  return useSyncExternalStore(subscribe, () => persistenceNotice, () => null);
}

export function dismissPersistenceNotice() {
  persistenceNotice = null;
  emit();
}

export function getRecoveryBackup(): string | null {
  try {
    return window.localStorage.getItem(DEMO_BACKUP_KEY);
  } catch {
    return null;
  }
}

/** Null during server render / hydration, then the live shop state. */
export function useShopState(): ShopState | null {
  return useSyncExternalStore<ShopState | null>(subscribe, getSnapshot, getServerSnapshot);
}

/** Use inside trees that only render after hydration (the app shell gates its children). */
export function useShop(): ShopState {
  const s = useShopState();
  return s ?? getSnapshot();
}

const noopSubscribe = () => () => {};
export function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

// ---------- Signed-in member ----------

export type Me = { id: string; name: string; role: string; initials: string };
const MeContext = createContext<Me | null>(null);

export function MeProvider({ me, children }: { me: Me; children: ReactNode }) {
  return <MeContext.Provider value={me}>{children}</MeContext.Provider>;
}

export function useMe(): Me {
  const me = useContext(MeContext);
  if (!me) throw new Error("useMe must be used inside <MeProvider>");
  return me;
}

// ---------- Helpers ----------

function advance(job: Job, status: JobStatus, by: string): Job {
  if (statusIndex(status) <= statusIndex(job.status)) return job;
  return { ...job, status, timeline: [...job.timeline, { status, at: nowISO(), by }] };
}

const mapJob = (s: ShopState, jobId: string, fn: (j: Job) => Job) => s.jobs.map((j) => (j.id === jobId ? fn(j) : j));

function uniqueCode(s: ShopState) {
  let code = makeCode();
  while (s.reports.some((r) => r.code === code)) code = makeCode();
  return code;
}

// ---------- Actions ----------

export type WorkOrderInput = {
  name: string;
  phone: string;
  email: string;
  year: number;
  make: string;
  model: string;
  plate: string;
  mileage: number;
  complaint: string;
  time: string;
  techId: string | null;
  customerId?: string;
  vehicleId?: string;
};

export function createWorkOrder(input: WorkOrderInput, byId: string): string {
  let jobId = "";
  setState((s) => {
    let seq = s.seq;
    const customers = [...s.customers];
    const vehicles = [...s.vehicles];
    const phone10 = digits(input.phone).slice(-10);

    const foundCustomer = input.customerId
      ? customers.find((c) => c.id === input.customerId)
      : phone10.length === 10
        ? customers.find((c) => digits(c.phone).slice(-10) === phone10)
        : undefined;
    let customerId: string;
    if (foundCustomer) {
      customerId = foundCustomer.id;
    } else {
      seq += 1;
      customerId = `c${seq}`;
      customers.push({
        id: customerId,
        name: input.name.trim(),
        phone: formatPhone(input.phone),
        email: input.email.trim(),
        city: "Massachusetts",
        since: s.anchorDay.slice(0, 4),
      });
    }

    const plate = input.plate.trim().toUpperCase().replace(/\s+/g, "");
    const foundIdx = input.vehicleId
      ? vehicles.findIndex((v) => v.id === input.vehicleId)
      : vehicles.findIndex((v) => v.plate === plate);
    let vehicleId: string;
    if (foundIdx >= 0) {
      const existing = vehicles[foundIdx];
      vehicleId = existing.id;
      vehicles[foundIdx] = { ...existing, customerId, mileage: Math.max(existing.mileage, input.mileage || 0) };
    } else {
      seq += 1;
      vehicleId = `v${seq}`;
      vehicles.push({
        id: vehicleId,
        customerId,
        year: input.year,
        make: input.make,
        model: input.model.trim(),
        trim: "",
        color: "",
        plate,
        mileage: input.mileage || 0,
        vin: "",
      });
    }

    const maxNum = s.jobs.reduce((m, j) => Math.max(m, Number(j.id.replace(/\D/g, "")) || 0), 2000);
    jobId = `J-${maxNum + 1}`;
    const job: Job = {
      id: jobId,
      date: s.anchorDay,
      time: input.time,
      customerId,
      vehicleId,
      complaint: input.complaint.trim(),
      status: "waiting",
      assignedTo: input.techId,
      mileageIn: input.mileage || 0,
      timeline: [{ status: "waiting", at: nowISO(), by: byId }],
    };
    return { ...s, seq, customers, vehicles, jobs: [job, ...s.jobs] };
  });
  return jobId;
}

export function acceptJob(jobId: string, techId: string) {
  setState((s) => ({ ...s, jobs: mapJob(s, jobId, (j) => advance({ ...j, assignedTo: techId }, "accepted", techId)) }));
}

export function setJobStatus(jobId: string, status: JobStatus, by: string) {
  setState((s) => ({ ...s, jobs: mapJob(s, jobId, (j) => advance(j, status, by)) }));
}

export function assignJob(jobId: string, techId: string | null) {
  setState((s) => ({ ...s, jobs: mapJob(s, jobId, (j) => ({ ...j, assignedTo: techId })) }));
}

export function updateInspection(jobId: string, by: string, fn: (i: Inspection) => Inspection) {
  setState((s) => {
    const existing = s.inspections.find((i) => i.jobId === jobId);
    const base = existing ?? { ...blankInspection(jobId, by), startedAt: nowISO() };
    const next = fn(base);
    const inspections = existing
      ? s.inspections.map((i) => (i.jobId === jobId ? next : i))
      : [...s.inspections, next];
    const jobs = mapJob(s, jobId, (j) => {
      const withTech = j.assignedTo ? j : { ...j, assignedTo: by };
      return advance(advance(withTech, "accepted", by), "inspection", by);
    });
    return { ...s, inspections, jobs };
  });
}

export function completeInspection(jobId: string, by: string): string {
  let code = "";
  setState((s) => {
    const existing = s.inspections.find((i) => i.jobId === jobId);
    const base = existing ?? { ...blankInspection(jobId, by), startedAt: nowISO() };
    const done: Inspection = { ...base, techId: base.techId ?? by, completedAt: base.completedAt ?? nowISO() };
    const inspections = existing
      ? s.inspections.map((i) => (i.jobId === jobId ? done : i))
      : [...s.inspections, done];
    let reports = s.reports;
    const rep = s.reports.find((r) => r.jobId === jobId);
    if (rep) {
      code = rep.code;
    } else {
      code = uniqueCode(s);
      reports = [...s.reports, { code, jobId, createdAt: nowISO(), sentAt: null }];
    }
    const jobs = mapJob(s, jobId, (j) => {
      const withTech = j.assignedTo ? j : { ...j, assignedTo: by };
      return advance(advance(advance(withTech, "accepted", by), "inspection", by), "inspection_complete", by);
    });
    return { ...s, inspections, reports, jobs };
  });
  return code;
}

export function sendReport(jobId: string, body: string, by: string) {
  setState((s) => {
    const job = s.jobs.find((j) => j.id === jobId);
    const rep = s.reports.find((r) => r.jobId === jobId);
    if (!job || !rep) return s;
    const at = nowISO();
    const msg: Message = {
      id: `m${s.seq + 1}`,
      customerId: job.customerId,
      jobId,
      direction: "out",
      kind: "report",
      body,
      link: `/r/${rep.code}`,
      at,
      by,
    };
    return {
      ...s,
      seq: s.seq + 1,
      reports: s.reports.map((r) => (r.code === rep.code ? { ...r, sentAt: at } : r)),
      messages: [...s.messages, msg],
      jobs: mapJob(s, jobId, (j) => advance(j, "customer_contacted", by)),
    };
  });
}

export function createEstimate(jobId: string): string {
  let id = "";
  setState((s) => {
    const existing = s.estimates.find((e) => e.jobId === jobId);
    if (existing) {
      id = existing.id;
      return s;
    }
    const ins = s.inspections.find((i) => i.jobId === jobId);
    let seq = s.seq;
    const lines = ins
      ? buildEstimateLines(ins, s.settings, () => {
          seq += 1;
          return `l${seq}`;
        })
      : [];
    const maxNum = s.estimates.reduce((m, e) => Math.max(m, Number(e.id.replace(/\D/g, "")) || 0), 1000);
    id = `E-${maxNum + 1}`;
    const est: Estimate = { id, jobId, createdAt: nowISO(), status: "draft", sentAt: null, approvedAt: null, lines };
    return { ...s, seq, estimates: [...s.estimates, est] };
  });
  return id;
}

export function updateEstimate(id: string, fn: (e: Estimate) => Estimate) {
  setState((s) => ({ ...s, estimates: s.estimates.map((e) => (e.id === id ? fn(e) : e)) }));
}

export function nextLineId() {
  let id = "";
  setState((s) => {
    id = `l${s.seq + 1}`;
    return { ...s, seq: s.seq + 1 };
  });
  return id;
}

export function sendEstimate(id: string, body: string, by: string) {
  setState((s) => {
    const est = s.estimates.find((e) => e.id === id);
    const job = est ? s.jobs.find((j) => j.id === est.jobId) : undefined;
    if (!est || !job) return s;
    const rep = s.reports.find((r) => r.jobId === job.id);
    const at = nowISO();
    const msg: Message = {
      id: `m${s.seq + 1}`,
      customerId: job.customerId,
      jobId: job.id,
      direction: "out",
      kind: "estimate",
      body,
      link: rep ? `/r/${rep.code}` : undefined,
      at,
      by,
    };
    return {
      ...s,
      seq: s.seq + 1,
      estimates: s.estimates.map((e) =>
        e.id === id ? { ...e, status: e.status === "approved" ? e.status : "sent", sentAt: at } : e,
      ),
      messages: [...s.messages, msg],
      jobs: mapJob(s, job.id, (j) => advance(j, "customer_contacted", by)),
    };
  });
}

export function approveEstimate(id: string, by: string, viaCustomer = false) {
  setState((s) => {
    const est = s.estimates.find((e) => e.id === id);
    const job = est ? s.jobs.find((j) => j.id === est.jobId) : undefined;
    if (!est || !job) return s;
    const at = nowISO();
    const lines = est.lines.map((l) => (l.decision === "pending" ? { ...l, decision: "approved" as const } : l));
    const anyApproved = lines.some((l) => l.decision === "approved");
    const messages: Message[] = viaCustomer
      ? [
          ...s.messages,
          {
            id: `m${s.seq + 1}`,
            customerId: job.customerId,
            jobId: job.id,
            direction: "in",
            kind: "text",
            body: anyApproved
              ? "Approved the recommended work from my inspection report."
              : "Declined the recommended work for now.",
            at,
          },
        ]
      : s.messages;
    return {
      ...s,
      seq: s.seq + 1,
      messages,
      estimates: s.estimates.map((e) =>
        e.id === id ? { ...e, lines, status: anyApproved ? "approved" : "declined", approvedAt: at } : e,
      ),
      jobs: mapJob(s, job.id, (j) => (anyApproved ? advance(advance(j, "customer_contacted", by), "approved", by) : j)),
    };
  });
}

export function sendMessage(customerId: string, body: string, by: string, jobId?: string) {
  setState((s) => ({
    ...s,
    seq: s.seq + 1,
    messages: [
      ...s.messages,
      { id: `m${s.seq + 1}`, customerId, jobId, direction: "out", kind: "text", body, at: nowISO(), by },
    ],
  }));
}

export function addMedia(m: Omit<Media, "id">): string {
  let id = "";
  setState((s) => {
    id = `md${s.seq + 1}`;
    return { ...s, seq: s.seq + 1, media: [{ ...m, id }, ...s.media] };
  });
  return id;
}

export function updateMedia(id: string, patch: Partial<Media>) {
  setState((s) => ({ ...s, media: s.media.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
}

export function removeMedia(id: string) {
  setState((s) => ({ ...s, media: s.media.filter((m) => m.id !== id) }));
}

export function updateSettings(patch: Partial<Settings>) {
  setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
}

export function addTeamMember(name: string, role: string): Member {
  const member: Member = { id: `t${Date.now()}`, name: name.trim(), role: role.trim() || "Technician", initials: initials(name) };
  setState((s) => ({ ...s, team: [...s.team, member] }));
  return member;
}

export function addExpense(input: Omit<ExpenseTransaction, "id">): string {
  let id = "";
  setState((s) => {
    id = `x${s.seq + 1}`;
    return { ...s, seq: s.seq + 1, expenses: [{ ...input, id }, ...s.expenses] };
  });
  return id;
}

export function updateExpense(id: string, patch: Partial<ExpenseTransaction>) {
  setState((s) => ({ ...s, expenses: s.expenses.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
}

export function removeExpense(id: string) {
  setState((s) => ({ ...s, expenses: s.expenses.filter((x) => x.id !== id) }));
}

export function resetDemo() {
  setState(() => createSeed(todayISO()));
}

export function exportJSON() {
  return JSON.stringify(getSnapshot(), null, 2);
}
