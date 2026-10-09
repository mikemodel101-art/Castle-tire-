"use client";

import { useState } from "react";
import { Check, ChevronLeft, Copy, MessageSquare, Send, X } from "lucide-react";
import { CastleLogo, TireMark } from "@/components/brand";
import { sendReport, useMe, useShop } from "@/lib/store";
import { fillTemplate, firstName, fmtDate, fmtMiles, fmtTime, nowISO, smsHref, vehicleLabel, type JobBundle } from "@/lib/utils";

export function SendReportModal({
  bundle,
  onClose,
  onSent,
}: {
  bundle: JobBundle;
  onClose: () => void;
  onSent?: () => void;
}) {
  const state = useShop();
  const me = useMe();
  const { job, customer, vehicle, report } = bundle;
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const link = report ? `${origin}/r/${report.code}` : "";
  const [body, setBody] = useState(() =>
    fillTemplate(state.settings.reportTemplate, {
      first: firstName(customer.name),
      vehicle: vehicleLabel(vehicle),
      link,
      shop: state.settings.shopName,
    }),
  );
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);

  if (!report) return null;

  const parts = body.split(link);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  function markSent() {
    sendReport(job.id, body, me.id);
    setSent(true);
    onSent?.();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/70 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="Send report to customer">
      <div className="anim-fade-up grid max-h-[96dvh] w-full max-w-4xl overflow-y-auto rounded-t-3xl bg-slate-100 shadow-2xl sm:rounded-3xl md:grid-cols-[1fr_340px]">
        {/* Composer */}
        <div className="space-y-4 bg-white p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Customer text &amp; report</p>
              <h2 className="mt-1 text-xl font-bold text-slate-950">Send to {customer.name}</h2>
              <p className="text-sm text-slate-500">{customer.phone} · {vehicleLabel(vehicle)}</p>
            </div>
            <button type="button" onClick={onClose} aria-label="Close" className="grid size-9 place-items-center rounded-full text-slate-500 hover:bg-slate-100">
              <X className="size-5" />
            </button>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Message</span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              className="w-full rounded-xl border border-slate-200 p-3.5 text-[15px] leading-relaxed outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
            />
          </label>

          <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-slate-600">{link}</span>
            <button type="button" onClick={copy} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
              {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>

          {sent || report.sentAt ? (
            <div className="anim-pop flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-emerald-800 ring-1 ring-emerald-200">
              <Check className="size-5 shrink-0" />
              <p className="text-sm">
                <span className="font-bold">Report sent.</span> Logged in Messages. Job moved to &ldquo;Customer Contacted&rdquo;.
              </p>
            </div>
          ) : null}

          <div className="grid gap-2 sm:grid-cols-2">
            <a
              href={smsHref(customer.phone, body)}
              onClick={markSent}
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <MessageSquare className="size-4" /> Send Text Message
            </a>
            <button type="button" onClick={markSent} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-white font-semibold text-slate-800 ring-1 ring-slate-200 transition hover:bg-slate-50">
              <Send className="size-4" /> Mark as sent
            </button>
          </div>
          <p className="text-xs text-slate-500">
            &ldquo;Send Text Message&rdquo; opens your phone&apos;s Messages app with this text filled in. Automatic texting through a
            provider like Twilio can be connected later. The customer only needs a browser, no app.
          </p>
        </div>

        {/* Phone preview */}
        <div className="flex items-center justify-center p-5 sm:p-6">
          <div className="w-[300px] overflow-hidden rounded-[2.4rem] border-[10px] border-slate-900 bg-white shadow-2xl">
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2.5">
              <ChevronLeft className="size-4 text-blue-600" />
              <TireMark className="size-7" />
              <p className="flex-1 text-sm font-semibold text-slate-900">{state.settings.shopName}</p>
            </div>
            <div className="space-y-2 bg-white px-3 py-4">
              <div className="max-w-[88%] rounded-2xl rounded-bl-md bg-slate-100 px-3 py-2 text-[13px] leading-snug text-slate-900">
                {parts.map((p, i) => (
                  <span key={i}>
                    {p}
                    {i < parts.length - 1 && <span className="break-all text-blue-600 underline">{link.replace(/^https?:\/\//, "")}</span>}
                  </span>
                ))}
              </div>
              <p className="text-center text-[10px] text-slate-400">Today {fmtTime(report.sentAt ?? nowISO())}</p>
              <div className="max-w-[88%] overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-slate-200">
                <div className="flex justify-center bg-white px-3 pt-3">
                  <CastleLogo className="h-9 w-auto" />
                </div>
                <div className="px-3 pb-3 pt-2 text-center">
                  <p className="text-[12px] font-black tracking-tight text-slate-950">VEHICLE INSPECTION REPORT</p>
                  <p className="text-[12px] font-bold text-slate-800">{vehicleLabel(vehicle)}</p>
                  <p className="text-[11px] text-slate-600">Plate: {vehicle.plate}</p>
                  <p className="text-[11px] text-slate-600">Mileage: {fmtMiles(job.mileageIn || vehicle.mileage).replace(" mi", "")}</p>
                  <p className="text-[11px] text-slate-600">Date: {fmtDate(job.date, { month: "short", day: "numeric", year: "numeric" })}</p>
                  <span className="mt-2 block rounded-lg bg-blue-600 py-1.5 text-[12px] font-semibold text-white">View Full Report</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
