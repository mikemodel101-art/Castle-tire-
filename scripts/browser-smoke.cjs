/* Browser regression checks against a running production preview.
 * Playwright is test-only: it does not need to be an application dependency.
 * See README.md for the command to run this using npx.
 */
const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.BASE_URL || "http://localhost:3000";
const key = "castle-tire-demo-v4";
const errors = [];

(async () => {
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const contexts = [];
  const makeContext = async () => {
    const c = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    contexts.push(c);
    // Stock media isn't relevant to crash regression tests; do not depend on Pexels uptime.
    await c.route(/https:\/\/(images|videos)\.pexels\.com\//, (route) => route.abort());
    c.on("page", (p) => {
      p.on("pageerror", (e) => errors.push(`${p.url()}: ${e.message}`));
      p.on("console", (m) => {
        if (m.type() === "error" && !m.text().startsWith("Failed to load resource")) errors.push(`${p.url()}: ${m.text()}`);
      });
    });
    return c;
  };
  const authenticate = (c) => c.addCookies([{ name: "castle_session", value: "admin@castletire.com", url: base, httpOnly: true, sameSite: "Lax" }]);
  const visit = async (p, path, heading) => {
    const response = await p.goto(`${base}${path}`, { waitUntil: "domcontentloaded" });
    assert.equal(response.status(), 200, `HTTP status for ${path}`);
    await p.getByRole("heading", { level: 1 }).first().waitFor({ state: "visible", timeout: 15000 });
    const text = await p.getByRole("heading", { level: 1 }).allTextContents();
    assert.ok(text.some((t) => heading.test(t)), `${path}: unexpected heading ${JSON.stringify(text)}`);
    console.log(`PASS ${path}`);
  };

  try {
    const clean = await makeContext();
    const page = await clean.newPage();
    await page.goto(`${base}/login`);
    await page.getByRole("button", { name: "Sign in to the shop", exact: true }).click();
    await page.waitForURL("**/dashboard");
    await page.getByRole("heading", { level: 1 }).first().waitFor();
    const welcome = page.getByRole("button", { name: "Explore on my own", exact: true });
    if (await welcome.isVisible()) await welcome.click();
    console.log("PASS demo login");

    const routes = [
      ["/dashboard", /Good (morning|afternoon|evening)/],
      ["/jobs", /Today's Jobs/],
      ["/jobs/new?vehicle=v1", /New Vehicle/],
      ["/jobs/J-2051", /Toyota RAV4/],
      ["/expenses", /Expenses/],
      ["/customers", /Customers/],
      ["/customers/c1", /John Smith/],
      ["/vehicles", /Vehicles/],
      ["/inspections", /Inspections/],
      ["/inspections/J-2051", /Inspection/],
      ["/inspections/J-2051/complete", /Inspection Complete/],
      ["/inspections/J-2051/sheet", /VEHICLE INSPECTION SHEET/],
      ["/estimates", /Estimates/],
      ["/estimates/E-1002", /Aisha Thompson/],
      ["/reports", /Inspection reports/],
      ["/messages", /Messages/],
      ["/settings", /Settings/],
      ["/guide", /Learn Castle/],
      ["/r/K7Q2XM", /VEHICLE INSPECTION REPORT/],
      ["/r/K7Q2XM/sheet", /VEHICLE INSPECTION SHEET/],
    ];
    for (const [path, heading] of routes) await visit(page, path, heading);

    await visit(page, "/expenses", /Expenses/);
    await page.getByRole("button", { name: "Add income", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel(/Description/).fill("Browser smoke payment");
    await dialog.getByLabel(/Amount/).fill("123.45");
    await dialog.getByRole("button", { name: "Record income", exact: true }).click();
    await page.getByText("Browser smoke payment", { exact: true }).waitFor();
    await page.waitForTimeout(400);
    await page.reload();
    await page.getByText("Browser smoke payment", { exact: true }).waitFor();
    const saved = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), key);
    assert.ok(saved.expenses.some((e) => e.description === "Browser smoke payment" && e.amount === 123.45));
    console.log("PASS expense survives reload");

    await visit(page, "/dashboard", /Good (morning|afternoon|evening)/);
    await page.getByRole("button", { name: "Tour", exact: true }).click();
    await page.getByText("1/5 · Dashboard", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByText("2/5 · Today's Jobs", { exact: true }).waitFor();
    await page.getByRole("button", { name: "End tour", exact: true }).click();
    await page.getByRole("button", { name: "Replay 60-sec tour", exact: true }).click();
    await page.getByText("1/5 · Dashboard", { exact: true }).waitFor();
    await page.getByRole("button", { name: "End tour", exact: true }).click();
    console.log("PASS both tour buttons and restart");

    const fixtures = [
      ["partial/null collections", key, JSON.stringify({ version: 4, anchorDay: saved.anchorDay, jobs: null, media: [], expenses: [] })],
      ["malformed JSON", key, "{not-json"],
      ["broken nested data", key, JSON.stringify({ ...saved, jobs: [null, ...saved.jobs], inspections: [{ ...saved.inspections[0], tires: null, notes: null }, ...saved.inspections.slice(1)], settings: { taxRate: null } })],
      ["older v3 save", "castle-tire-demo-v3", JSON.stringify({ ...saved, version: 3, expenses: undefined })],
    ];
    for (const [name, storageKey, raw] of fixtures) {
      const context = await makeContext();
      await authenticate(context);
      await context.addInitScript(({ storageKey, raw }) => {
        if (location.protocol !== "http:" && location.protocol !== "https:") return;
        if (sessionStorage.getItem("castle-test-fixture")) return;
        localStorage.setItem(storageKey, raw);
        localStorage.setItem("castle-welcomed", "1");
        localStorage.setItem("castle-tour-step", "-42");
        sessionStorage.setItem("castle-test-fixture", "1");
      }, { storageKey, raw });
      const p = await context.newPage();
      await visit(p, "/dashboard", /Good (morning|afternoon|evening)/);
      await visit(p, "/expenses", /Expenses/);
      await visit(p, "/inspections", /Inspections/);
      await p.reload();
      await p.getByRole("heading", { level: 1, name: /Inspections/ }).waitFor();
      if (name !== "older v3 save") {
        const backup = await p.evaluate(() => localStorage.getItem("castle-tire-demo-recovery-backup"));
        assert.equal(backup, raw, `${name} original save backup`);
      } else {
        const migrated = await p.evaluate((k) => JSON.parse(localStorage.getItem(k)), key);
        assert.ok(migrated.expenses.length > 0);
        assert.ok(migrated.expenses.every((e) => Number.isFinite(e.amount)));
      }
      await p.getByRole("button", { name: "Replay 60-sec tour", exact: true }).click();
      await p.getByText("1/5 · Dashboard", { exact: true }).waitFor();
      console.log(`PASS recovery: ${name}`);
    }

    const restricted = await makeContext();
    await authenticate(restricted);
    await restricted.addInitScript(() => {
      Object.defineProperty(window, "localStorage", { configurable: true, get() { throw new DOMException("Blocked preview storage", "SecurityError"); } });
    });
    const privatePage = await restricted.newPage();
    await visit(privatePage, "/dashboard", /Good (morning|afternoon|evening)/);
    await privatePage.getByText("Session-only demo mode", { exact: true }).waitFor();
    console.log("PASS browser storage blocked: in-memory fallback");

    await visit(page, "/dashboard", /Good (morning|afternoon|evening)/);
    const otherTab = await clean.newPage();
    await otherTab.goto(`${base}/login`);
    await otherTab.evaluate((k) => localStorage.setItem(k, JSON.stringify({ version: 4, anchorDay: "2026-99-99", jobs: null, media: [] })), key);
    await page.waitForTimeout(700);
    assert.match(await page.getByRole("heading", { level: 1 }).first().textContent(), /Good (morning|afternoon|evening)/);
    await page.getByText("Your demo save has been recovered", { exact: true }).waitFor();
    console.log("PASS invalid cross-tab storage update");

    assert.deepEqual(errors, [], `Browser exceptions / React errors:\n${errors.join("\n")}`);
    console.log("ALL BROWSER REGRESSIONS PASSED");
  } finally {
    await Promise.all(contexts.map((c) => c.close()));
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
