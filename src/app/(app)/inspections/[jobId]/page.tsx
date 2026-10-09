import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { InspectionForm, type InspectionJobInfo } from "@/components/inspection-form";
import { PageHeader, StatusBadge } from "@/components/ui";
import { CATEGORIES, MEDIA, TEAM, type Category } from "@/lib/data";
import {
  customerForJob,
  findJob,
  formatDate,
  inspectionForJob,
  sectionStatuses,
  vehicleForJob,
  vehicleLabel,
} from "@/lib/utils";

export const metadata = { title: "Vehicle inspection" };

export default async function InspectionPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const job = findJob(jobId);
  if (!job) notFound();

  const customer = customerForJob(job);
  const vehicle = vehicleForJob(job);
  const initial = inspectionForJob(job);
  const overall = sectionStatuses(initial).overall;

  const info: InspectionJobInfo = {
    id: job.id,
    service: job.service,
    time: job.time,
    date: job.date,
    customerName: customer?.name ?? "Walk-in customer",
    customerPhone: customer?.phone ?? "",
    vehicleLabel: vehicle ? vehicleLabel(vehicle) : "Vehicle",
    plate: vehicle?.plate ?? "",
    mileage: vehicle?.mileage ?? 0,
  };

  const mediaCounts = Object.fromEntries(
    CATEGORIES.map((c) => [c.id, MEDIA.filter((m) => m.jobId === job.id && m.category === c.id).length]),
  ) as Record<Category, number>;

  return (
    <div className="space-y-6">
      <Link href="/inspections" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft className="size-4" /> All inspections
      </Link>

      <PageHeader
        eyebrow={`Digital inspection · ${job.id} · ${formatDate(job.date)}`}
        title={`${info.vehicleLabel}${vehicle?.color ? ` · ${vehicle.color}` : ""}`}
        subtitle={`${info.customerName} · ${info.plate} · ${job.service}`}
        actions={<StatusBadge status={overall} />}
      />

      <InspectionForm job={info} initial={initial} team={TEAM} mediaCounts={mediaCounts} />
    </div>
  );
}
