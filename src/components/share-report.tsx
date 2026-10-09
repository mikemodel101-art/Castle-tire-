"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Copy, ExternalLink, MessageSquare } from "lucide-react";
import { smsLink } from "@/lib/utils";

export function ShareReport({
  reportId,
  customerFirstName,
  phone,
  vehicle,
}: {
  reportId: string;
  customerFirstName: string;
  phone: string;
  vehicle: string;
}) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const link = `${origin}/r/${reportId}`;
  const message = `Hi ${customerFirstName}, your Castle Tire Shop inspection report for your ${vehicle} is ready. View photos, videos and recommendations here: ${link}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={origin ? smsLink(phone, message) : "#"}
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 active:scale-[0.98]"
      >
        <MessageSquare className="size-4" /> Text to customer
      </a>
      <button
        type="button"
        onClick={copy}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
      >
        {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
        {copied ? "Link copied" : "Copy link"}
      </button>
      <Link
        href={`/r/${reportId}`}
        target="_blank"
        className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
      >
        <ExternalLink className="size-4" /> Preview
      </Link>
    </div>
  );
}
