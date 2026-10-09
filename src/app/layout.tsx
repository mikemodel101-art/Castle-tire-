import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Castle Tire Shop · Shop Operations",
    template: "%s · Castle Tire Shop",
  },
  description:
    "Castle Tire Shop daily operations: jobs, digital inspections, media capture, estimates, customer history and public reports.",
  applicationName: "Castle Tire Shop",
  keywords: [
    "tire shop software",
    "auto repair saas",
    "digital vehicle inspections",
    "repair shop dashboard",
    "customer vehicle history",
    "inspection reports",
  ],
  appleWebApp: {
    capable: true,
    title: "Castle Tire",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: true },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-100 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
