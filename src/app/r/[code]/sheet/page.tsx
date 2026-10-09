import type { Metadata } from "next";
import { PublicSheet } from "@/components/customer-report";

export const metadata: Metadata = {
  title: "Vehicle Inspection Sheet",
  robots: { index: false, follow: false },
};

export default async function CustomerSheetPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <PublicSheet code={code} />;
}
