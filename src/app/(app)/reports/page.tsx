import { CheckCircle2, FileText, Send } from "lucide-react";
import { Card, PageHeader } from "@/components/ui";
import { ShareReport } from "@/components/share-report";
import { REPORTS } from "@/lib/data";
import { customerForJob, findJob, formatDate, sectionStatuses, inspectionForJob, vehicleForJob, vehicleLabel } from "@/lib/utils";
import { StatusBadge } from "@/components/ui";

export const metadata = { title: "Customer reports" };

export default function ReportsPage() {
  const rows = REPORTS.map((r) => {
    const job = findJob(r.jobId);
    const customer = job ? customerForJob(job) : undefined;
    const vehicle = job ? vehicleForJob(job) : undefined;
    const overall = job ? sectionStatuses(inspectionForJob(job)).overall : "pending";
    return { report: r, job, customer, vehicle, overall };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Customer reports"
        title="Inspection reports"
        subtitle="Branded digital reports. Text the link to the customer, who can view photos and videos in any browser with no app."
      />

      <div className="anim-fade-up grid gap-3 sm:grid-cols-3">
        {[
          { label: "Total reports", value: REPORTS.length, icon: FileText, tone: "text-slate-900" },
          { label: "Ready to send", value: REPORTS.filter((r) => r.status === "Ready").length, icon: Send, tone: "text-sky-600" },
          { label: "Sent by text", value: REPORTS.filter((r) => r.status === "Sent").length, icon: CheckCircle2, tone: "text-emerald-600" },
        ].map((s) => (
          <Card key={s.label} className="flex items-center gap-4 p-5">
            <span className="grid size-11 place-items-center rounded-xl bg-slate-950 text-amber-300">
              <s.icon className="size-5" />
            </span>
            <div>
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className={`text-2xl font-bold ${s.tone}`}>{s.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {rows.map(({ report, job, customer, vehicle, overall }, i) => (
          <Card key={report.id} className="anim-fade-up overflow-hidden p-0" >
            <div style={{ animationDelay: `${i * 0.06}s` }}>
              <div className="flex items-center justify-between gap-3 bg-slate-950 px-5 py-4 text-white">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.16em] text-amber-300">Castle Tire Shop</p>
                  <p className="truncate font-mono text-sm">{report.id}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${report.status === "Sent" ? "bg-emerald-500/20 text-emerald-200" : "bg-sky-500/20 text-sky-200"}`}>
                  {report.status}
                </span>
              </div>
              <div className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-950">{customer?.name}</p>
                    <p className="truncate text-sm text-slate-600">{vehicle ? vehicleLabel(vehicle) : ""} · <span className="font-mono">{vehicle?.plate}</span></p>
                    <p className="mt-1 text-xs text-slate-500">
                      {job ? formatDate(job.date) : ""} · {job?.service}
                    </p>
                  </div>
                  <StatusBadge status={overall} />
                </div>
                {report.sentTo && (
                  <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">Sent to {report.sentTo}</p>
                )}
                <ShareReport
                  reportId={report.id}
                  customerFirstName={customer?.name.split(" ")[0] ?? "there"}
                  phone={customer?.phone ?? ""}
                  vehicle={vehicle ? vehicleLabel(vehicle) : "vehicle"}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
