"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Camera,
  Check,
  ClipboardCheck,
  Compass,
  Lightbulb,
  PartyPopper,
  Receipt,
  Send,
  Sparkles,
  UserRound,
  Wrench,
  X,
} from "lucide-react";
import { useShop } from "@/lib/store";

const KEY = "castle-onboard-v1";
const TOUR_KEY = "castle-tour-step";

export type ChecklistId = "job" | "accept" | "inspect" | "photo" | "report" | "estimate";

export const CHECKLIST: { id: ChecklistId; title: string; hint: string; href: string; icon: typeof Wrench }[] = [
  { id: "job", title: "Create your first job", hint: "Check in a vehicle in ~30 seconds", href: "/jobs/new", icon: UserRound },
  { id: "accept", title: "Accept a job as tech", hint: "Claim it from Today's Jobs", href: "/jobs", icon: BadgeCheck },
  { id: "inspect", title: "Run a digital inspection", hint: "Tires, brakes, TPMS, suspension, alignment", href: "/inspections", icon: ClipboardCheck },
  { id: "photo", title: "Add a photo or video", hint: "Tap any camera button in the inspection", href: "/media", icon: Camera },
  { id: "report", title: "Send a customer report", hint: "Text the branded link — no app needed", href: "/reports", icon: Send },
  { id: "estimate", title: "Build an estimate", hint: "Auto-built from findings, one tap", href: "/estimates", icon: Receipt },
];

function loadDone(): Record<ChecklistId, boolean> {
  const done: Record<ChecklistId, boolean> = { job: false, accept: false, inspect: false, photo: false, report: false, estimate: false };
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return done;
    for (const item of CHECKLIST) done[item.id] = (parsed as Record<string, unknown>)[item.id] === true;
  } catch {
    // Browser storage may be blocked in embedded/private previews.
  }
  return done;
}

export function useOnboarding() {
  const [done, setDone] = useState<Record<ChecklistId, boolean>>(() => {
    if (typeof window === "undefined") return { job: false, accept: false, inspect: false, photo: false, report: false, estimate: false };
    return loadDone();
  });
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  useEffect(() => {
    try {
      if (!localStorage.getItem("castle-welcomed")) setWelcomeOpen(true);
    } catch {
      setWelcomeOpen(true);
    }
  }, []);
  const complete = (id: ChecklistId) => {
    setDone((d) => {
      const next = { ...d, [id]: true };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };
  const reset = () => {
    const empty = { job: false, accept: false, inspect: false, photo: false, report: false, estimate: false };
    setDone(empty);
    try {
      localStorage.setItem(KEY, JSON.stringify(empty));
      localStorage.removeItem("castle-welcomed");
    } catch {}
  };
  const dismissWelcome = () => {
    setWelcomeOpen(false);
    try {
      localStorage.setItem("castle-welcomed", "1");
    } catch {}
  };
  const finished = Object.values(done).filter(Boolean).length;
  return { done, complete, reset, welcomeOpen, dismissWelcome, setWelcomeOpen, finished };
}

/** Auto-marks checklist items based on real shop activity. */
export function useAutoChecklist(done: Record<ChecklistId, boolean>, complete: (id: ChecklistId) => void) {
  const state = useShop();
  useEffect(() => {
    if (!done.job && state.jobs.length > 13) complete("job");
    if (!done.accept && state.jobs.some((j) => j.status !== "waiting")) complete("accept");
    if (!done.inspect && state.inspections.some((i) => i.completedAt)) complete("inspect");
    if (!done.photo && state.media.length > 21) complete("photo");
    if (!done.report && state.reports.some((r) => r.sentAt)) complete("report");
    if (!done.estimate && state.estimates.some((e) => e.status !== "draft")) complete("estimate");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
}

export function WelcomeModal({ open, onClose, onTour }: { open: boolean; onClose: () => void; onTour: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Welcome to Castle Tire Shop">
      <div className="anim-fade-up w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-brand-900 p-6 text-white">
          <div className="anim-float absolute -right-10 -top-10 size-40 rounded-full border-[16px] border-white/5" />
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-brand-300">
            <Sparkles className="size-4" /> Welcome to Castle Tire Shop
          </p>
          <h2 className="mt-2 text-2xl font-bold leading-tight sm:text-3xl">
            Run your whole shop day in 6 taps.
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            New here? Take the 60-second tour, then follow the checklist. Everything runs on safe dummy data — click anything.
          </p>
          <button type="button" onClick={onClose} aria-label="Close welcome" className="absolute right-4 top-4 grid size-9 place-items-center rounded-full bg-white/10 hover:bg-white/20">
            <X className="size-5" />
          </button>
        </div>
        <div className="grid gap-2 p-5">
          {[
            { icon: Wrench, t: "Check in a car", d: "Jobs → New Vehicle" },
            { icon: ClipboardCheck, t: "Inspect with green / yellow / red", d: "Tires, brakes, TPMS, suspension, alignment" },
            { icon: Send, t: "Text the report + estimate", d: "Customer opens it — no app needed" },
          ].map((r) => (
            <div key={r.t} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-950 text-white">
                <r.icon className="size-4" />
              </span>
              <div>
                <p className="text-sm font-bold text-slate-900">{r.t}</p>
                <p className="text-xs text-slate-500">{r.d}</p>
              </div>
            </div>
          ))}
          <div className="mt-1 grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={onTour} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-600 font-bold text-white hover:bg-brand-700">
              <Compass className="size-4" /> Start 60-sec tour
            </button>
            <button type="button" onClick={onClose} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-100 font-bold text-slate-800 hover:bg-slate-200">
              Explore on my own
            </button>
          </div>
          <Link href="/guide" onClick={onClose} className="mx-auto mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:underline">
            <BookOpen className="size-4" /> Open the newcomer guide instead
          </Link>
        </div>
      </div>
    </div>
  );
}

const TOUR_STEPS = [
  { title: "1/5 · Dashboard", text: "Your morning briefing: who is waiting, what needs attention, and today's money.", href: "/dashboard" },
  { title: "2/5 · Today's Jobs", text: "Every vehicle from check-in to pickup. Tap a card, then Accept Job.", href: "/jobs" },
  { title: "3/5 · Inspection", text: "Measure tread in /32 and pads in mm. Colors pick themselves. Camera on every corner.", href: "/inspections" },
  { title: "4/5 · Report", text: "Complete the inspection, preview the customer view, and text the link.", href: "/reports" },
  { title: "5/5 · Estimate", text: "One tap builds the estimate from findings. Customer approves from their phone.", href: "/estimates" },
];

export function GuidedTour({ active, onDone }: { active: boolean; onDone: () => void }) {
  const [step, setStep] = useState(() => {
    try {
      const saved = Number(localStorage.getItem(TOUR_KEY) ?? 0);
      return Number.isFinite(saved) ? Math.max(0, Math.min(TOUR_STEPS.length - 1, Math.floor(saved))) : 0;
    } catch {
      return 0;
    }
  });
  useEffect(() => {
    const restart = () => setStep(0);
    window.addEventListener("castle:tour-start", restart);
    return () => window.removeEventListener("castle:tour-start", restart);
  }, []);
  useEffect(() => {
    if (!active) return;
    try {
      localStorage.setItem(TOUR_KEY, String(step));
    } catch {}
  }, [step, active]);
  if (!active) return null;
  const s = TOUR_STEPS[step] ?? TOUR_STEPS[0];
  const last = step >= TOUR_STEPS.length - 1;
  return (
    <div className="fixed bottom-24 left-1/2 z-[75] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 md:bottom-8">
      <div className="anim-fade-up rounded-2xl bg-slate-950 p-4 text-white shadow-2xl ring-1 ring-white/10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-300">{s.title}</p>
            <p className="mt-1 text-sm leading-snug text-slate-100">{s.text}</p>
          </div>
          <button type="button" onClick={onDone} aria-label="End tour" className="grid size-8 shrink-0 place-items-center rounded-full bg-white/10 hover:bg-white/20">
            <X className="size-4" />
          </button>
        </div>
        <div className="mt-2 flex gap-1.5">
          {TOUR_STEPS.map((_, i) => (
            <span key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-brand-500" : "bg-white/15"}`} />
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Link href={s.href} className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-white text-sm font-bold text-slate-950 hover:bg-slate-100">
            Go there <ArrowRight className="size-4" />
          </Link>
          {!last ? (
            <button type="button" onClick={() => setStep(step + 1)} className="h-10 rounded-xl bg-white/10 px-4 text-sm font-bold hover:bg-white/20">
              Next
            </button>
          ) : (
            <button type="button" onClick={onDone} className="h-10 rounded-xl bg-emerald-500 px-4 text-sm font-bold hover:bg-emerald-400">
              Finish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ChecklistCard({ done, finished }: { done: Record<ChecklistId, boolean>; finished: number }) {
  const pct = Math.round((finished / CHECKLIST.length) * 100);
  const allDone = finished === CHECKLIST.length;
  return (
    <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 to-slate-800 p-5 text-white shadow-lg">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-bold">
          <PartyPopper className="size-4 text-brand-300" /> {allDone ? "You did it — shop pro!" : `Getting started · ${finished}/${CHECKLIST.length}`}
        </p>
        <Link href="/guide" className="text-xs font-bold text-brand-300 hover:text-white">
          Guide →
        </Link>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-amber-300 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {CHECKLIST.map((c) => {
          const on = done[c.id];
          return (
            <li key={c.id}>
              <Link
                href={c.href}
                className={`flex items-center gap-2.5 rounded-xl p-2.5 text-left ring-1 transition hover:-translate-y-0.5 ${on ? "bg-emerald-500/15 ring-emerald-400/30" : "bg-white/5 ring-white/10 hover:bg-white/10"}`}
              >
                <span className={`grid size-7 shrink-0 place-items-center rounded-full ${on ? "bg-emerald-500 text-white" : "bg-white/10 text-slate-300"}`}>
                  {on ? <Check className="size-4" strokeWidth={3} /> : <c.icon className="size-4" />}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-bold">{c.title}</span>
                  <span className="block truncate text-[11px] text-slate-400">{c.hint}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function HelpTip({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
        aria-label={`Help: ${title}`}
        className="ml-1.5 inline-grid size-5 place-items-center rounded-full bg-blue-100 text-xs font-black text-blue-700 hover:bg-blue-200"
      >
        ?
      </button>
      {open && (
        <span className="absolute left-0 top-7 z-30 w-64 rounded-xl bg-slate-950 p-3 text-left text-xs leading-relaxed text-white shadow-xl">
          <span className="mb-1 flex items-center gap-1.5 font-bold text-brand-300">
            <Lightbulb className="size-3.5" /> {title}
          </span>
          {children}
        </span>
      )}
    </span>
  );
}

let tourActive = false;
const tourListeners = new Set<() => void>();
const subscribeTour = (listener: () => void) => {
  tourListeners.add(listener);
  return () => { tourListeners.delete(listener); };
};
const setTour = (value: boolean) => {
  tourActive = value;
  tourListeners.forEach((listener) => listener());
};

export function useTourState() {
  const tour = useSyncExternalStore(subscribeTour, () => tourActive, () => false);
  const start = () => {
    try {
      localStorage.setItem(TOUR_KEY, "0");
      localStorage.setItem("castle-welcomed", "1");
    } catch {}
    window.dispatchEvent(new Event("castle:tour-start"));
    setTour(true);
  };
  return { tour, setTour, start };
}

export function demoHints() {
  return null;
}

export function FirstRunBanner({ onTour, onGuide }: { onTour: () => void; onGuide: string }) {
  const [hide, setHide] = useState(() => {
    try {
      return localStorage.getItem("castle-welcomed") === "1";
    } catch {
      return false;
    }
  });
  const items = useMemo(() => CHECKLIST.slice(0, 3), []);
  if (hide) return null;
  return (
    <div className="anim-fade-up relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-600 via-brand-500 to-amber-500 p-[1.5px] shadow-lg shadow-brand-600/20">
      <div className="rounded-2xl bg-white p-4 sm:p-5">
        <button type="button" onClick={() => setHide(true)} aria-label="Dismiss" className="absolute right-3 top-3 grid size-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100">
          <X className="size-4" />
        </button>
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-brand-600">
          <Sparkles className="size-4" /> New to Castle? Start here
        </p>
        <h2 className="mt-1 text-lg font-bold text-slate-950 sm:text-xl">Your first car in under 2 minutes.</h2>
        <ol className="mt-3 grid gap-2 sm:grid-cols-3">
          {items.map((c, i) => (
            <li key={c.id} className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5 ring-1 ring-slate-100">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-slate-950 text-[11px] font-black text-white">{i + 1}</span>
              <span className="text-xs font-semibold text-slate-800">{c.title}</span>
            </li>
          ))}
        </ol>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={onTour} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white hover:bg-slate-800">
            <Compass className="size-4" /> Take the tour
          </button>
          <Link href={onGuide} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand-50 px-4 text-sm font-bold text-brand-700 ring-1 ring-brand-200 hover:bg-brand-100">
            <BookOpen className="size-4" /> Newcomer guide
          </Link>
        </div>
      </div>
    </div>
  );
}
