// Analytics + insight helpers computed from dummy shop data.
// All pure functions — no database, no side effects.

import type { Job, ShopState } from "./data";
import {
  byId,
  daysBetween,
  estimateTotals,
  overallLight,
  parseLocal,
  sectionChip,
  slotMinutes,
  type JobBundle,
} from "./utils";
import { SUMMARY_ORDER } from "./data";

/* ---------- customers ---------- */

export function customerStats(state: ShopState, customerId: string) {
  const jobs = state.jobs.filter((j) => j.customerId === customerId);
  const vehicles = state.vehicles.filter((v) => v.customerId === customerId);
  const estimates = state.estimates.filter((e) =>
    jobs.some((j) => j.id === e.jobId),
  );
  const approvedTotals = estimates
    .filter((e) => e.status === "approved")
    .reduce((s, e) => s + estimateTotals(e, state.settings.taxRate, true).total, 0);
  const sentTotals = estimates
    .filter((e) => e.status === "sent")
    .reduce((s, e) => s + estimateTotals(e, state.settings.taxRate).total, 0);
  const sorted = [...jobs].sort((a, b) => b.date.localeCompare(a.date));
  const lastVisit = sorted[0]?.date ?? null;
  const daysSince = lastVisit ? daysBetween(lastVisit, state.anchorDay) : null;
  const openRecs = vehicles.flatMap((v) => {
    const latest = jobs
      .filter((j) => j.vehicleId === v.id)
      .map((j) => state.inspections.find((i) => i.jobId === j.id && i.completedAt))
      .find(Boolean);
    if (!latest) return [];
    return SUMMARY_ORDER.filter((sec) => {
      const c = sectionChip(latest, sec, state.settings);
      return c.light === "red" || c.light === "yellow";
    });
  }).length;

  const segment =
    jobs.length >= 5 || approvedTotals >= 2000
      ? ("VIP" as const)
      : jobs.length <= 1
        ? ("New" as const)
        : daysSince !== null && daysSince > 180
          ? ("At-risk" as const)
          : ("Returning" as const);

  return {
    visits: jobs.length,
    vehicles: vehicles.length,
    lifetimeValue: approvedTotals,
    awaitingValue: sentTotals,
    lastVisit,
    daysSince,
    openRecs,
    segment,
    avgTicket: estimates.length ? approvedTotals / Math.max(1, estimates.filter((e) => e.status === "approved").length) : 0,
  };
}

/* ---------- vehicles ---------- */

export function vehicleService(state: ShopState, vehicleId: string) {
  const jobs = state.jobs
    .filter((j) => j.vehicleId === vehicleId)
    .sort((a, b) => b.date.localeCompare(a.date));
  const last = jobs[0] ?? null;
  const daysSince = last ? daysBetween(last.date, state.anchorDay) : null;
  const milesSince =
    jobs.length >= 2 ? Math.max(0, (jobs[0].mileageIn || 0) - (jobs[1].mileageIn || 0)) : 0;
  const latest = jobs
    .map((j) => state.inspections.find((i) => i.jobId === j.id && i.completedAt))
    .find(Boolean);
  let worst: "red" | "yellow" | "green" | "none" = "none";
  if (latest) {
    const l = overallLight(latest, state.settings);
    worst = l === "red" ? "red" : l === "yellow" ? "yellow" : l === "green" ? "green" : "none";
  }
  const dueRotation =
    daysSince === null || daysSince >= 180 || milesSince >= 6000 || worst !== "green";
  const due =
    daysSince === null
      ? "New to shop"
      : daysSince >= 180
        ? `${Math.floor(daysSince / 30)} mo since visit`
        : milesSince >= 5000
          ? `${milesSince.toLocaleString()} mi since visit`
          : worst === "red"
            ? "Needs work"
            : worst === "yellow"
              ? "Check soon"
              : "Up to date";
  return { jobs: jobs.length, last, daysSince, milesSince, latest, worst, dueRotation, due };
}

/* ---------- jobs ---------- */

export function jobWaitLabel(job: Job, today: string) {
  const waitingAt = job.timeline.find((t) => t.status === "waiting")?.at;
  const acceptedAt = job.timeline.find((t) => t.status === "accepted")?.at;
  if (!waitingAt) return null;
  const end = acceptedAt ?? `${today}T${to24(job.time)}:00`;
  try {
    const mins = Math.max(
      0,
      Math.round((parseLocal(end).getTime() - parseLocal(waitingAt).getTime()) / 60000),
    );
    if (mins < 1) return "just arrived";
    if (mins < 60) return `${mins}m wait`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m wait`;
  } catch {
    return null;
  }
}

function to24(t: string) {
  const m = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return "09:00";
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === "PM") h += 12;
  return `${String(h).padStart(2, "0")}:${m[2]}`;
}

export function jobPriority(state: ShopState, jobId: string): "urgent" | "soon" | null {
  const ins = state.inspections.find((i) => i.jobId === jobId);
  if (!ins) return null;
  const l = overallLight(ins, state.settings);
  if (l === "red") return "urgent";
  if (l === "yellow") return "soon";
  return null;
}

/* ---------- inspections ---------- */

export function inspectionStats(state: ShopState) {
  const all = state.inspections;
  const done = all.filter((i) => i.completedAt);
  let red = 0;
  let yellow = 0;
  for (const i of done) {
    const l = overallLight(i, state.settings);
    if (l === "red") red++;
    else if (l === "yellow") yellow++;
  }
  let avgMins = 0;
  const durations = done
    .filter((i) => i.startedAt && i.completedAt)
    .map((i) => (parseLocal(i.completedAt!).getTime() - parseLocal(i.startedAt!).getTime()) / 60000)
    .filter((n) => n >= 0 && n < 8 * 60);
  if (durations.length) avgMins = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
  const todayDone = done.filter((i) => i.completedAt?.startsWith(state.anchorDay)).length;
  return { total: all.length, done: done.length, todayDone, red, yellow, avgMins };
}

/* ---------- estimates ---------- */

export function estimateFunnel(state: ShopState) {
  const list = state.estimates;
  const by = (s: string) => list.filter((e) => e.status === s);
  const sent = by("sent");
  const approved = by("approved");
  const conversion = sent.length + approved.length ? Math.round((approved.length / (sent.length + approved.length)) * 100) : 0;
  const aging = sent
    .map((e) => ({ e, age: daysBetween(e.sentAt?.slice(0, 10) ?? e.createdAt.slice(0, 10), state.anchorDay) }))
    .sort((a, b) => b.age - a.age);
  const stale = aging.filter((a) => a.age >= 2).length;
  return {
    draft: by("draft").length,
    sent: sent.length,
    approved: approved.length,
    declined: by("declined").length,
    conversion,
    aging,
    stale,
  };
}

export function estimateAgeDays(createdOrSent: string, today: string) {
  return daysBetween(createdOrSent.slice(0, 10), today);
}

/* ---------- reports ---------- */

export function reportAnalytics(state: ShopState) {
  const total = state.reports.length;
  const sent = state.reports.filter((r) => r.sentAt).length;
  const rate = total ? Math.round((sent / total) * 100) : 0;
  const times = state.reports
    .filter((r) => r.sentAt)
    .map((r) => (parseLocal(r.sentAt!).getTime() - parseLocal(r.createdAt).getTime()) / 60000)
    .filter((n) => n >= 0 && n < 24 * 60);
  const avgMins = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
  const oldest = [...state.reports]
    .filter((r) => !r.sentAt)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
  return { total, sent, rate, avgMins, oldest };
}

/* ---------- dashboard ---------- */

export function weeklyTrend(state: ShopState) {
  // Last 7 days ending today (dummy data is anchored so older days may be empty).
  const days: { label: string; date: string; jobs: number; revenue: number }[] = [];
  for (let d = 6; d >= 0; d--) {
    const dt = new Date(parseLocal(state.anchorDay).getTime() - d * 86400000);
    const iso = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
    const jobs = state.jobs.filter((j) => j.date === iso);
    const rev = state.estimates
      .filter((e) => e.status === "approved" && jobs.some((j) => j.id === e.jobId))
      .reduce((s, e) => s + estimateTotals(e, state.settings.taxRate, true).total, 0);
    days.push({
      label: dt.toLocaleDateString("en-US", { weekday: "narrow" }),
      date: iso,
      jobs: jobs.length,
      revenue: Math.round(rev),
    });
  }
  return days;
}

export type FeedItem = {
  id: string;
  at: string;
  kind: "job" | "message" | "estimate" | "report" | "media";
  title: string;
  detail: string;
  href: string;
};

export function activityFeed(state: ShopState, limit = 12): FeedItem[] {
  const items: FeedItem[] = [];
  for (const j of state.jobs.slice(0, 30)) {
    const c = byId(state.customers, j.customerId);
    const last = j.timeline[j.timeline.length - 1];
    if (!last) continue;
    items.push({
      id: `job-${j.id}-${last.status}`,
      at: last.at,
      kind: "job",
      title: `${j.id} → ${last.status.replace(/_/g, " ")}`,
      detail: `${c?.name ?? ""} · ${j.complaint}`,
      href: `/jobs/${j.id}`,
    });
  }
  for (const m of state.messages.slice(-20)) {
    const c = byId(state.customers, m.customerId);
    items.push({
      id: `msg-${m.id}`,
      at: m.at,
      kind: "message",
      title: m.direction === "out" ? `Text to ${c?.name ?? ""}` : `Reply from ${c?.name ?? ""}`,
      detail: m.body.slice(0, 90),
      href: `/messages?c=${m.customerId}`,
    });
  }
  for (const e of state.estimates) {
    items.push({
      id: `est-${e.id}-${e.status}`,
      at: e.approvedAt ?? e.sentAt ?? e.createdAt,
      kind: "estimate",
      title: `${e.id} ${e.status}`,
      detail: `${e.lines.length} items`,
      href: `/estimates/${e.id}`,
    });
  }
  for (const r of state.reports) {
    items.push({
      id: `rep-${r.code}`,
      at: r.sentAt ?? r.createdAt,
      kind: "report",
      title: `Report ${r.code} ${r.sentAt ? "sent" : "ready"}`,
      detail: r.jobId,
      href: `/reports`,
    });
  }
  return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}

export function techLeaderboard(state: ShopState) {
  return state.team.map((m) => {
    const jobs = state.jobs.filter((j) => j.assignedTo === m.id && j.date === state.anchorDay);
    const completed = state.jobs.filter((j) => j.assignedTo === m.id && j.status === "completed").length;
    const inspections = state.inspections.filter((i) => i.techId === m.id && i.completedAt).length;
    const revenue = state.estimates
      .filter((e) => e.status === "approved")
      .filter((e) => {
        const j = byId(state.jobs, e.jobId);
        return j?.assignedTo === m.id;
      })
      .reduce((s, e) => s + estimateTotals(e, state.settings.taxRate, true).total, 0);
    return { member: m, todayJobs: jobs.length, completed, inspections, revenue: Math.round(revenue) };
  });
}

export function dashboardAlerts(state: ShopState) {
  const today = state.anchorDay;
  const todays = state.jobs.filter((j) => j.date === today);
  const unassigned = todays.filter((j) => !j.assignedTo && j.status === "waiting");
  const readyReports = state.reports.filter((r) => !r.sentAt);
  const staleEstimates = state.estimates.filter((e) => {
    if (e.status !== "sent" || !e.sentAt) return false;
    return daysBetween(e.sentAt.slice(0, 10), today) >= 2;
  });
  const redNotContacted = todays.filter((j) => {
    if (["customer_contacted", "approved", "completed"].includes(j.status)) return false;
    const ins = state.inspections.find((i) => i.jobId === j.id && i.completedAt);
    if (!ins) return false;
    return overallLight(ins, state.settings) === "red";
  });
  return { unassigned, readyReports, staleEstimates, redNotContacted };
}

export function todayRevenue(state: ShopState) {
  const today = state.anchorDay;
  const todays = state.jobs.filter((j) => j.date === today);
  const approved = state.estimates.filter(
    (e) => e.status === "approved" && todays.some((j) => j.id === e.jobId),
  );
  const awaiting = state.estimates.filter((e) => e.status === "sent");
  const approvedTotal = approved.reduce((s, e) => s + estimateTotals(e, state.settings.taxRate, true).total, 0);
  const awaitingTotal = awaiting.reduce((s, e) => s + estimateTotals(e, state.settings.taxRate).total, 0);
  const avgTicket = approved.length ? approvedTotal / approved.length : 0;
  return { approvedTotal: Math.round(approvedTotal), awaitingTotal: Math.round(awaitingTotal), avgTicket: Math.round(avgTicket), approvedCount: approved.length };
}

export function sortJobs(jobs: Job[], sort: "time" | "status" | "tech") {
  const copy = [...jobs];
  if (sort === "time") copy.sort((a, b) => slotMinutes(a.time) - slotMinutes(b.time));
  if (sort === "status") copy.sort((a, b) => a.status.localeCompare(b.status));
  if (sort === "tech") copy.sort((a, b) => (a.assignedTo ?? "zzz").localeCompare(b.assignedTo ?? "zzz"));
  return copy;
}

export type ExpenseRange = "today" | "week" | "month" | "all";

export function inExpenseRange(date: string, today: string, range: ExpenseRange) {
  if (range === "all") return true;
  if (range === "today") return date === today;
  const diff = daysBetween(date, today);
  if (diff < 0) return false;
  if (range === "week") return diff < 7;
  return diff < 31;
}

export function expenseSummary(state: ShopState, range: ExpenseRange = "month") {
  const list = (state.expenses ?? []).filter((x) => inExpenseRange(x.date, state.anchorDay, range));
  const income = list.filter((x) => x.type === "income").reduce((s, x) => s + x.amount, 0);
  const expense = list.filter((x) => x.type === "expense").reduce((s, x) => s + x.amount, 0);
  const byCategory = (type: "income" | "expense") => {
    const map = new Map<string, number>();
    for (const x of list.filter((y) => y.type === type)) map.set(x.category, (map.get(x.category) ?? 0) + x.amount);
    return [...map.entries()].map(([label, value]) => ({ label, value: Math.round(value) })).sort((a, b) => b.value - a.value);
  };
  const byMethod = (() => {
    const map = new Map<string, number>();
    for (const x of list) map.set(x.method, (map.get(x.method) ?? 0) + (x.type === "income" ? x.amount : -x.amount));
    return [...map.entries()];
  })();
  void byMethod;
  return {
    income: Math.round(income),
    expense: Math.round(expense),
    net: Math.round(income - expense),
    count: list.length,
    incomeByCat: byCategory("income"),
    expenseByCat: byCategory("expense"),
    list: [...list].sort((a, b) => b.at.localeCompare(a.at)),
  };
}

export function expenseDaily(state: ShopState, days = 14) {
  const out: { label: string; date: string; income: number; expense: number }[] = [];
  for (let d = days - 1; d >= 0; d--) {
    const dt = new Date(parseLocal(state.anchorDay).getTime() - d * 86400000);
    const iso = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
    const dayList = (state.expenses ?? []).filter((x) => x.date === iso);
    out.push({
      label: dt.toLocaleDateString("en-US", { month: "numeric", day: "numeric" }),
      date: iso,
      income: Math.round(dayList.filter((x) => x.type === "income").reduce((s, x) => s + x.amount, 0)),
      expense: Math.round(dayList.filter((x) => x.type === "expense").reduce((s, x) => s + x.amount, 0)),
    });
  }
  return out;
}

export function bundleForReport(state: ShopState, code: string): JobBundle | null {
  const r = state.reports.find((x) => x.code === code);
  if (!r) return null;
  const job = state.jobs.find((j) => j.id === r.jobId);
  if (!job) return null;
  const customer = byId(state.customers, job.customerId);
  const vehicle = byId(state.vehicles, job.vehicleId);
  if (!customer || !vehicle) return null;
  return {
    job,
    customer,
    vehicle,
    tech: byId(state.team, job.assignedTo),
    inspection: state.inspections.find((i) => i.jobId === job.id),
    report: r,
    estimate: state.estimates.find((e) => e.jobId === job.id),
    media: state.media.filter((m) => m.jobId === job.id),
  };
}
