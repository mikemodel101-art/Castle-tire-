// Health check used by hosting platforms. The app runs entirely on dummy data
// (src/lib/seed.ts) and never connects to a database, so there is nothing to query.
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ ok: true, mode: "demo", database: "none" });
}
