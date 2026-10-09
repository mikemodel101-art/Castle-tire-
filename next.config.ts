import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import type { NextConfig } from "next";

/**
 * GitHub upload-on-top deployments can retain deleted source files. Next.js scans
 * routes and TypeScript checks every source file, even a helper nobody imports.
 *
 * Remove only known obsolete files with recognizable old-code signatures before
 * either scan. Keep real TypeScript checking enabled; don't add fake type aliases
 * to make an incompatible old expense model appear valid.
 */
const FIRST_VERSION_CODE = /\b(JOBS|CATEGORIES|CATEGORY_LABEL|STAGES|sectionStatuses|statusMeta|smsLink)\b/;

// The retired finance helper imports types missing from the current data model.
// A new finance.ts using ExpenseTransaction must remain untouched.
const RETIRED_FINANCE_IMPORT = /\bimport\s+(?:type\s+)?\{[^}]*\b(?:ExpenseCategory|ExpenseEntry)\b[^}]*\}\s*from\s*["']\.\/data["']/m;

type LegacyFile = { remove: string; inspect: string; signature: RegExp };

const LEGACY_FILES: LegacyFile[] = [
  { remove: "src/app/r/[reportId]", inspect: "src/app/r/[reportId]/page.tsx", signature: FIRST_VERSION_CODE },
  { remove: "src/components/job-board.tsx", inspect: "src/components/job-board.tsx", signature: FIRST_VERSION_CODE },
  { remove: "src/components/inspection-form.tsx", inspect: "src/components/inspection-form.tsx", signature: FIRST_VERSION_CODE },
  { remove: "src/components/customer-search.tsx", inspect: "src/components/customer-search.tsx", signature: FIRST_VERSION_CODE },
  { remove: "src/components/share-report.tsx", inspect: "src/components/share-report.tsx", signature: FIRST_VERSION_CODE },
  { remove: "src/components/media-library.tsx", inspect: "src/components/media-library.tsx", signature: FIRST_VERSION_CODE },
  { remove: "src/lib/finance.ts", inspect: "src/lib/finance.ts", signature: RETIRED_FINANCE_IMPORT },
];

/** Exported for regression tests; Next.js uses only the default config below. */
export function removeLegacyFiles(root = process.cwd(), log: (message: string) => void = console.warn): string[] {
  const removed: string[] = [];
  for (const { remove, inspect, signature } of LEGACY_FILES) {
    const file = join(root, inspect);
    if (!existsSync(file)) continue;
    try {
      if (!signature.test(readFileSync(file, "utf8"))) continue;
      rmSync(join(root, remove), { recursive: true, force: true });
      removed.push(remove);
      log(`[castle-tire] Removed leftover file from an older version: ${remove}`);
    } catch (error) {
      // Stop with an actionable message instead of hiding a cleanup failure and
      // letting TypeScript fail later with a confusing missing-type error.
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(`[castle-tire] Could not clean obsolete file ${remove}. Delete it from the repository and rebuild. ${reason}`);
    }
  }
  return removed;
}

removeLegacyFiles();

const nextConfig: NextConfig = {};

export default nextConfig;
