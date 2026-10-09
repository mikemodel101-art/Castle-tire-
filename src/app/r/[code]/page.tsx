import type { Metadata } from "next";
import { CustomerReport } from "@/components/customer-report";

export const metadata: Metadata = {
  title: "Vehicle Inspection Report",
  description: "Your Castle Tire Shop vehicle inspection report with photos, videos and recommendations.",
  robots: { index: false, follow: false },
};

export default async function CustomerReportPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <CustomerReport code={code} />;
}
