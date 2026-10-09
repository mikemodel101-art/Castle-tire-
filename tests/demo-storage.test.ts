import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeDemoState, validDay } from "../src/lib/demo-storage";
import { createSeed, STORE_VERSION } from "../src/lib/seed";
import { dashboardAlerts, expenseSummary, activityFeed, inspectionStats, customerStats } from "../src/lib/insights";

const today = "2026-05-14";

function exercisePages(raw: unknown) {
  const normalized = normalizeDemoState(raw, today);
  const s = normalized.state;
  assert.doesNotThrow(() => {
    dashboardAlerts(s);
    expenseSummary(s);
    activityFeed(s);
    inspectionStats(s);
    s.customers.forEach((c) => customerStats(s, c.id));
    s.jobs.filter((j) => j.date === today);
    s.inspections.forEach((i) => { i.notes.tires.trim(); i.tires.LF.tread; });
    s.estimates.forEach((e) => e.lines.filter((l) => l.decision === "approved"));
  });
  return normalized;
}

test("a complete seed remains valid without triggering recovery", () => {
  const seed = createSeed(today);
  const result = exercisePages(seed);
  assert.equal(result.repaired, false);
  assert.equal(result.migrated, false);
  assert.deepEqual(result.state, seed);
});

test("the exact page-load failure fixture is repaired (null jobs, missing collections)", () => {
  const result = exercisePages({ version: 4, anchorDay: today, jobs: null, media: [], expenses: [] });
  assert.equal(result.repaired, true);
  assert.ok(result.state.jobs.length > 0);
  assert.ok(Array.isArray(result.state.estimates));
  assert.ok(Array.isArray(result.state.messages));
});

test("unknown versions and invalid JSON values fall back to a safe demo", () => {
  for (const raw of [null, undefined, 7, "bad save", [], { version: 999 }]) {
    const result = exercisePages(raw);
    assert.equal(result.repaired, true);
    assert.equal(result.state.version, STORE_VERSION);
  }
});

test("version 3 upgrades without losing custom customers", () => {
  const original = createSeed(today);
  original.customers.push({ id: "c777", name: "Saved customer", phone: "(508) 555-0111", email: "", city: "Worcester, MA", since: "2026" });
  const legacy: Record<string, unknown> = { ...original, version: 3 };
  delete legacy.expenses;
  const result = exercisePages(legacy);
  assert.equal(result.migrated, true);
  assert.equal(result.repaired, false);
  assert.equal(result.state.customers.at(-1)?.name, "Saved customer");
  assert.ok(result.state.expenses.length > 0);
  assert.ok(result.state.seq >= 777);
});

test("a partially damaged old save is both migrated and reported as repaired", () => {
  const legacy: Record<string, unknown> = { ...createSeed(today), version: 3, jobs: null };
  delete legacy.expenses;
  const result = exercisePages(legacy);
  assert.equal(result.migrated, true);
  assert.equal(result.repaired, true);
});

test("bad nested inspection fields recover the seeded row, keeping other valid edits", () => {
  const seed = createSeed(today);
  seed.customers[0].name = "John — custom edit";
  const bad: Record<string, unknown> = { ...seed };
  bad.inspections = [{ ...seed.inspections[0], tires: null, notes: null }, ...seed.inspections.slice(1)];
  const result = exercisePages(bad);
  assert.equal(result.repaired, true);
  assert.equal(result.state.customers[0].name, "John — custom edit");
  assert.ok(result.state.inspections.find((i) => i.jobId === "J-2051")?.tires.LF);
});

test("invalid settings, money, dates, collection entries, and duplicates do not crash pages", () => {
  const seed = createSeed(today);
  const bad = {
    ...seed,
    anchorDay: "2026-99-99",
    settings: { taxRate: "unknown", alignmentPackages: null },
    jobs: [null, seed.jobs[0], seed.jobs[0], { id: "broken" }],
    customers: [...seed.customers, null, { id: "incomplete" }],
    expenses: [null, { ...seed.expenses[0], amount: Number.NaN }, ...seed.expenses.slice(1)],
    messages: "not an array",
  };
  const result = exercisePages(bad);
  assert.equal(result.repaired, true);
  assert.equal(result.state.anchorDay, today);
  assert.ok(Number.isFinite(result.state.settings.taxRate));
  assert.equal(new Set(result.state.jobs.map((j) => j.id)).size, result.state.jobs.length);
});

test("empty collections are preserved rather than being reseeded", () => {
  const seed = createSeed(today);
  const empty = { ...seed, customers: [], vehicles: [], jobs: [], inspections: [], media: [], reports: [], estimates: [], messages: [], expenses: [] };
  const result = exercisePages(empty);
  assert.equal(result.repaired, false);
  assert.equal(result.state.jobs.length, 0);
  assert.equal(result.state.expenses.length, 0);
});

test("dangling child records are removed and unrelated bookkeeping is retained", () => {
  const seed = createSeed(today);
  const result = exercisePages({ ...seed, customers: [] });
  assert.equal(result.state.vehicles.length, 0);
  assert.equal(result.state.jobs.length, 0);
  assert.equal(result.state.inspections.length, 0);
  assert.equal(result.state.estimates.length, 0);
  assert.equal(result.state.reports.length, 0);
  assert.equal(result.state.expenses.length, seed.expenses.length);
  assert.ok(result.state.expenses.every((e) => !e.jobId));
});

test("a saved demo moves forward to today with report codes unchanged", () => {
  const previous = createSeed("2026-05-11");
  const result = exercisePages(previous);
  assert.equal(result.state.jobs[0].date, today);
  assert.equal(result.state.anchorDay, today);
  assert.equal(result.state.reports[0].code, previous.reports[0].code);
});

test("expired session video URLs are ignored on reload", () => {
  const seed = createSeed(today);
  seed.media.push({ ...seed.media[0], id: "md-expired", url: "blob:old-document", type: "video" });
  const result = exercisePages(seed);
  assert.ok(result.state.media.every((m) => !m.url.startsWith("blob:")));
});

test("calendar validation rejects invalid dates", () => {
  assert.equal(validDay("2026-02-30"), false);
  assert.equal(validDay("2026-99-99"), false);
  assert.equal(validDay("not a date"), false);
  assert.equal(validDay("2024-02-29"), true);
});
