"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Camera,
  Check,
  ChevronDown,
  ClipboardCheck,
  MousePointerClick,
  Play,
  Receipt,
  Send,
  Smartphone,
  UserRound,
  Wrench,
} from "lucide-react";
import { Card, PageHeader } from "@/components/ui";

const JOURNEY = [
  {
    n: 1,
    icon: UserRound,
    title: "Check in a vehicle",
    where: "Jobs → New Vehicle",
    href: "/jobs/new",
    time: "30 sec",
    what: "Type the phone number — returning customers fill in by themselves. Add year, make, model, plate, mileage and what they asked for.",
    tryIt: "Use John Smith · (857) 555-1234 to see autofill find his 2021 Toyota RAV4.",
    tip: "Tap the quick-pick chips (Tire repair, Alignment…) instead of typing the whole complaint.",
  },
  {
    n: 2,
    icon: BadgeCheck,
    title: "Accept the job",
    where: "Today's Jobs",
    href: "/jobs",
    time: "10 sec",
    what: "Waiting cards are unclaimed work. Open one and tap the green Accept Job button — it moves to your name and starts the clock.",
    tryIt: "Open any Waiting card and accept it as yourself. Watch the status timeline grow.",
    tip: "Use “My jobs” to see only your work on a busy day.",
  },
  {
    n: 3,
    icon: ClipboardCheck,
    title: "Run the inspection",
    where: "Inspections",
    href: "/inspections",
    time: "5–8 min",
    what: "Same 5 boxes as the paper sheet: Tires (tread in /32), Brakes (pads in mm + rotor), Suspension, Alignment (ALG 79–120), TPMS. Colors pick themselves from your numbers.",
    tryIt: "Type 4 in an LF tread box — it turns yellow (Soon). Type 2 and it turns red (Replace).",
    tip: "Green = good, yellow = plan it soon, red = fix today. That is the whole system.",
  },
  {
    n: 4,
    icon: Camera,
    title: "Prove it with photos",
    where: "Any inspection step",
    href: "/media",
    time: "1 min",
    what: "Every tire, axle and section has a camera button. On a phone it opens the camera; on a PC you can upload. Photos attach to that exact corner and show on the customer report.",
    tryIt: "In the Tires step, tap the camera on LF and add a photo with the note “outer edge wear”.",
    tip: "Short videos work too — great for noises and wobbles.",
  },
  {
    n: 5,
    icon: Send,
    title: "Text the report",
    where: "Inspection Complete → Send",
    href: "/reports",
    time: "20 sec",
    what: "Tap Complete Inspection, review the summary, then Send to Customer. Preview the phone view first — that is exactly what the customer sees. No app, no login for them.",
    tryIt: "Open /r/K7Q2XM in a private window: that is a real customer link.",
    tip: "“Send” opens your SMS app pre-filled and logs the text in Messages.",
  },
  {
    n: 6,
    icon: Receipt,
    title: "Estimate & approval",
    where: "Estimates",
    href: "/estimates",
    time: "1 min",
    what: "Create Estimate builds lines from the red/yellow findings with parts + labor and MA tax. Text it; the customer taps Approve on their phone and the job flips to Approved.",
    tryIt: "Open E-1002, change a quantity, and watch totals update live.",
    tip: "Mark phone approvals with “Customer approved (by phone)” so the shop stays in sync.",
  },
];

const FAQS = [
  { q: "Is this real customer data?", a: "No. Everything is dummy data that lives only in your browser (localStorage). Break anything — Settings → Reset demo data restores it." },
  { q: "Do texts actually send?", a: "In the demo, Send opens your phone's Messages app with the text pre-filled, and logs it in Messages. A production version would send automatically via a provider like Twilio." },
  { q: "Where do photos go?", a: "They are compressed and stored in the browser with the vehicle. Videos last for the session. Production would upload to cloud storage (e.g. S3)." },
  { q: "Can customers really open reports without the app?", a: "Yes. /r/CODE links are public, mobile-friendly pages. Seeded demo links work anywhere; links you create in the demo only open in the browser that created them until a backend is added." },
  { q: "What do the colors mean?", a: "Green = Good/OK, Blue = Future (watch next visit), Yellow = Soon (plan it), Red = Replace/Now (unsafe — fix today). Thresholds are editable in Settings → Inspection standards." },
  { q: "Does it work on phones and tablets?", a: "Yes — it is a PWA. iPhone: Share → Add to Home Screen. Android/Windows: Install from the browser menu. The inspection wizard and camera are phone-first." },
];

const ROLES = [
  { icon: Wrench, role: "Technician (Luis)", flow: "Jobs → accept → Inspect → photos → Complete", href: "/jobs" },
  { icon: BadgeCheck, role: "Advisor (Jen)", flow: "Check in → send report → follow up estimates", href: "/messages" },
  { icon: BookOpen, role: "Owner (Mike)", flow: "Dashboard money → approve → review history", href: "/dashboard" },
];

export default function GuidePage() {
  const [open, setOpen] = useState<number | null>(0);
  const [done, setDone] = useState<Record<number, boolean>>({});
  const finished = Object.values(done).filter(Boolean).length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        eyebrow="Newcomer guide"
        title="Learn Castle in 10 minutes"
        subtitle="Follow the 6-step journey below. Every step links to the real screen with dummy data — you can't break anything."
        actions={
          <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
            <Play className="size-4" /> Back to shop
          </Link>
        }
      />

      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-slate-950 to-brand-900 p-5 text-white sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-300">Your first day, mapped</p>
          <h2 className="mt-1 text-xl font-bold sm:text-2xl">One car, start to finish.</h2>
          <p className="mt-1 text-sm text-slate-300">
            Check the boxes as you try each step. {finished}/6 done{finished === 6 ? " — you are ready for the shop floor. 🎉" : "."}
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-emerald-400 transition-all" style={{ width: `${(finished / 6) * 100}%` }} />
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {ROLES.map((r) => (
              <Link key={r.role} href={r.href} className="rounded-xl bg-white/10 p-3 ring-1 ring-white/15 transition hover:bg-white/15">
                <p className="flex items-center gap-2 text-sm font-bold"><r.icon className="size-4" /> {r.role}</p>
                <p className="mt-1 text-xs text-slate-300">{r.flow}</p>
              </Link>
            ))}
          </div>
        </div>
      </Card>

      <ol className="space-y-4">
        {JOURNEY.map((s) => {
          const isOpen = open === s.n;
          const isDone = done[s.n];
          return (
            <li key={s.n}>
              <Card className={`overflow-hidden transition ${isDone ? "ring-2 ring-emerald-500" : ""}`}>
                <button type="button" onClick={() => setOpen(isOpen ? null : s.n)} className="flex w-full items-center gap-4 p-4 text-left sm:p-5">
                  <span className={`grid size-10 shrink-0 place-items-center rounded-full text-sm font-black text-white ${isDone ? "bg-emerald-500" : "bg-brand-600"}`}>
                    {isDone ? <Check className="size-5" strokeWidth={3} /> : s.n}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-950">{s.title}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">{s.time}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-slate-500">{s.where}</span>
                  </span>
                  <ChevronDown className={`size-5 shrink-0 text-slate-400 transition ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="anim-fade-up space-y-3 border-t border-slate-100 p-4 sm:p-5">
                    <p className="text-sm leading-relaxed text-slate-700">{s.what}</p>
                    <p className="flex items-start gap-2 rounded-xl bg-blue-50 p-3 text-sm text-blue-900 ring-1 ring-blue-100">
                      <MousePointerClick className="mt-0.5 size-4 shrink-0" /> <span><b>Try it:</b> {s.tryIt}</span>
                    </p>
                    <p className="text-xs text-slate-500"><b className="text-slate-700">Tip:</b> {s.tip}</p>
                    <div className="flex flex-wrap gap-2">
                      <Link href={s.href} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700">
                        Open {s.where.split("→")[0].trim()} <ArrowRight className="size-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setDone((d) => ({ ...d, [s.n]: !d[s.n] }))}
                        className={`inline-flex h-10 items-center gap-1.5 rounded-xl px-4 text-sm font-bold ring-1 ${isDone ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"}`}
                      >
                        {isDone ? <><Check className="size-4" /> Done</> : "Mark done"}
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            </li>
          );
        })}
      </ol>

      <Card className="p-5 sm:p-6">
        <h2 className="flex items-center gap-2 font-bold text-slate-950"><Smartphone className="size-5 text-brand-600" /> Phone-first tips</h2>
        <ul className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
          <li className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100"><b>Bottom + button</b> on phones = instant New Vehicle from anywhere.</li>
          <li className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100"><b>Tread boxes</b> are big-number fields — gloves friendly.</li>
          <li className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100"><b>Camera buttons</b> open the rear camera directly.</li>
          <li className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100"><b>Install it:</b> iPhone Share → Add to Home Screen; Android → Install app.</li>
        </ul>
      </Card>

      <Card className="p-5 sm:p-6">
        <h2 className="font-bold text-slate-950">Questions newcomers always ask</h2>
        <div className="mt-3 divide-y divide-slate-100">
          {FAQS.map((f, i) => (
            <details key={i} className="group py-3" open={i === 0}>
              <summary className="cursor-pointer list-none text-sm font-bold text-slate-900 marker:hidden">
                <span className="mr-2 inline-grid size-6 place-items-center rounded-full bg-slate-100 text-xs group-open:bg-brand-600 group-open:text-white">{i + 1}</span>
                {f.q}
              </summary>
              <p className="mt-2 pl-8 text-sm leading-relaxed text-slate-600">{f.a}</p>
            </details>
          ))}
        </div>
      </Card>
    </div>
  );
}
