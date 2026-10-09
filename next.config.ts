import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import type { NextConfig } from "next";

/**
 * Deployment safety net (Vercel / any Git-based host).
 *
 * The first version of this app had files that were later removed or renamed.
 * Uploading a newer version to GitHub on top of an older one does NOT delete them,
 * and those leftovers break the build:
 *   - "Ambiguous app routes detected: /r/[code] vs /r/[reportId]"
 *   - type errors from imports that no longer exist
 *
 * Before Next.js scans the app, remove those leftovers, but only when the file still
 * contains the old code (it imports names that no longer exist), so a new file that
 * happens to reuse one of these names is never touched.
 */
const LEGACY_FILES: { remove: string; inspect: string }[] = [
  { remove: "src/app/r/[reportId]", inspect: "src/app/r/[reportId]/page.tsx" },
  { remove: "src/components/job-board.tsx", inspect: "src/components/job-board.tsx" },
  { remove: "src/components/inspection-form.tsx", inspect: "src/components/inspection-form.tsx" },
  { remove: "src/components/customer-search.tsx", inspect: "src/components/customer-search.tsx" },
  { remove: "src/components/share-report.tsx", inspect: "src/components/share-report.tsx" },
  { remove: "src/components/media-library.tsx", inspect: "src/components/media-library.tsx" },
];

// Names exported by the first version only.
const LEGACY_CODE = /\b(JOBS|CATEGORIES|CATEGORY_LABEL|STAGES|sectionStatuses|statusMeta|smsLink)\b/;

function removeLegacyFiles() {
  const root = process.cwd();
  for (const { remove, inspect } of LEGACY_FILES) {
    const file = join(root, inspect);
    if (!existsSync(file)) continue;
    try {
      if (!LEGACY_CODE.test(readFileSync(file, "utf8"))) continue;
      rmSync(join(root, remove), { recursive: true, force: true });
      console.warn(`[castle-tire] Removed leftover file from an older version: ${remove}`);
    } catch {
      // Best effort only. If removal fails, Next.js reports the original error.
    }
  }
}

removeLegacyFiles();

const nextConfig: NextConfig = {};

export default nextConfig;
