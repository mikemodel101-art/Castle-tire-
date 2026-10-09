import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { JobBoard } from "@/components/job-board";
import { PageHeader } from "@/components/ui";
import { SESSION_COOKIE, memberForEmail } from "@/lib/auth";
import { JOBS } from "@/lib/data";

export const metadata = { title: "Jobs" };

export default async function JobsPage() {
  const jar = await cookies();
  const me = memberForEmail(jar.get(SESSION_COOKIE)?.value);
  if (!me) redirect("/login");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Daily job management"
        title="Job board"
        subtitle="Claim unassigned work, accept your jobs, and move vehicles through each stage."
      />
      <JobBoard initialJobs={JOBS} me={me} />
    </div>
  );
}
