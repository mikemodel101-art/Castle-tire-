import assert from "node:assert/strict";
import { test } from "node:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { removeLegacyFiles } from "../next.config";

function inFixture(run: (root: string, put: (path: string, contents: string) => void) => void) {
  const root = mkdtempSync(join(tmpdir(), "castle-legacy-cleanup-"));
  const put = (path: string, contents: string) => {
    const target = join(root, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, contents);
  };
  try {
    run(root, put);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const silence = () => {};

const deployedFinance = `import type { ExpenseCategory, ExpenseEntry, ExpenseType } from "./data";
export const EXPENSE_CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  repair_sale: "Repair sale",
  tire_sale: "Tire sale",
  labor: "Labor income",
  parts_purchase: "Parts purchase",
  payroll: "Payroll",
  rent: "Rent",
  utilities: "Utilities",
  tools: "Tools & equipment",
  marketing: "Marketing",
  other: "Other",
};
export function sumByType(rows: ExpenseEntry[], type: ExpenseType) {
  return rows.filter((r) => r.type === type).reduce((sum, r) => sum + r.amount, 0);
}
export function netCashflow(rows: ExpenseEntry[]) {
  return sumByType(rows, "income") - sumByType(rows, "expense");
}
`;

test("removes the obsolete finance.ts that caused the Vercel type error", () => {
  inFixture((root, put) => {
    put("src/lib/finance.ts", deployedFinance);
    const removed = removeLegacyFiles(root, silence);
    assert.deepEqual(removed, ["src/lib/finance.ts"]);
    assert.equal(existsSync(join(root, "src/lib/finance.ts")), false);
  });
});

test("recognizes multiline old expense type imports", () => {
  inFixture((root, put) => {
    put("src/lib/finance.ts", "import type {\n  ExpenseType,\n  ExpenseEntry,\n} from './data';\n");
    assert.deepEqual(removeLegacyFiles(root, silence), ["src/lib/finance.ts"]);
  });
});

test("keeps a modern finance helper using the current ExpenseTransaction model", () => {
  inFixture((root, put) => {
    const modern = `import type { ExpenseTransaction, ExpenseType } from "./data";
export function sumByType(rows: ExpenseTransaction[], type: ExpenseType) {
  return rows.filter((r) => r.type === type).reduce((sum, r) => sum + r.amount, 0);
}
`;
    put("src/lib/finance.ts", modern);
    assert.deepEqual(removeLegacyFiles(root, silence), []);
    assert.equal(readFileSync(join(root, "src/lib/finance.ts"), "utf8"), modern);
  });
});

test("does not delete files merely mentioning the old type names in comments", () => {
  inFixture((root, put) => {
    const source = "// ExpenseCategory and ExpenseEntry were retired.\nexport const total = 0;\n";
    put("src/lib/finance.ts", source);
    assert.deepEqual(removeLegacyFiles(root, silence), []);
    assert.equal(readFileSync(join(root, "src/lib/finance.ts"), "utf8"), source);
  });
});

test("cleans the old route and components while preserving current routes and expense code", () => {
  inFixture((root, put) => {
    put("src/app/r/[reportId]/page.tsx", 'import { STAGES } from "@/lib/data";');
    put("src/app/r/[reportId]/sheet/page.tsx", "export default function OldSheet() { return null; }");
    put("src/app/r/[code]/page.tsx", "export default function CustomerReport() { return null; }");
    put("src/components/job-board.tsx", 'import { JOBS } from "@/lib/data";');
    put("src/lib/finance.ts", deployedFinance);
    put("src/lib/insights.ts", "export const expenseSummary = () => 0;");
    put("src/app/(app)/expenses/page.tsx", "export default function Expenses() { return null; }");
    const removed = removeLegacyFiles(root, silence);
    assert.deepEqual(removed, ["src/app/r/[reportId]", "src/components/job-board.tsx", "src/lib/finance.ts"]);
    assert.equal(existsSync(join(root, "src/app/r/[reportId]")), false);
    assert.equal(existsSync(join(root, "src/app/r/[code]/page.tsx")), true);
    assert.equal(existsSync(join(root, "src/lib/insights.ts")), true);
    assert.equal(existsSync(join(root, "src/app/(app)/expenses/page.tsx")), true);
    assert.deepEqual(removeLegacyFiles(root, silence), []);
  });
});

test("a clean repository has no cleanup work", () => {
  inFixture((root) => assert.deepEqual(removeLegacyFiles(root, silence), []));
});
