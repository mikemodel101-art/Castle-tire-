import type { ReactNode } from "react";
import { Info, Sparkles } from "lucide-react";
import { JOB_STATUS_LABEL, type JobStatus, type Light } from "@/lib/data";
import { LIGHT_META, jobGroup } from "@/lib/utils";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80 ${className}`}>{children}</div>;
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="anim-fade-up flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">{eyebrow}</p>}
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function LightChip({
  light,
  label,
  className = "",
  size = "md",
}: {
  light: Light;
  label: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = { sm: "px-2 py-0.5 text-[11px]", md: "px-2.5 py-1 text-xs", lg: "px-3.5 py-1.5 text-sm" };
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-semibold ring-1 ring-inset ${sizes[size]} ${LIGHT_META[light].chip} ${className}`}
    >
      <span className={`size-1.5 rounded-full ${LIGHT_META[light].dot}`} />
      {label}
    </span>
  );
}

export function SolidChip({ light, label, className = "" }: { light: Light; label: string; className?: string }) {
  return (
    <span
      className={`inline-flex min-w-24 items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold ${LIGHT_META[light].solid} ${className}`}
    >
      {label}
    </span>
  );
}

export function LightDot({ light, className = "" }: { light: Light; className?: string }) {
  return <span className={`inline-block size-2.5 shrink-0 rounded-full ${LIGHT_META[light].dot} ${className}`} />;
}

export function JobStatusBadge({ status, detail = false }: { status: JobStatus; detail?: boolean }) {
  const group = jobGroup(status);
  const cls =
    group === "waiting"
      ? "bg-amber-100 text-amber-800 ring-amber-500/30"
      : group === "completed"
        ? "bg-emerald-100 text-emerald-800 ring-emerald-500/30"
        : "bg-blue-100 text-blue-800 ring-blue-500/30";
  const label = group === "waiting" ? "Waiting" : group === "completed" ? "Completed" : "In Progress";
  return (
    <span className="inline-flex flex-col items-end gap-1">
      <span className={`whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${cls}`}>{label}</span>
      {detail && group === "progress" && (
        <span className="whitespace-nowrap text-[11px] font-medium text-slate-500">{JOB_STATUS_LABEL[status]}</span>
      )}
    </span>
  );
}

export function PlateBadge({ plate, className = "" }: { plate: string; className?: string }) {
  return (
    <span
      className={`inline-flex flex-col items-center rounded-[5px] border border-slate-300 bg-white px-1.5 pb-0.5 pt-px leading-none shadow-sm ${className}`}
    >
      <span className="text-[6px] font-bold uppercase tracking-[0.18em] text-brand-600">Mass</span>
      <span className="font-mono text-[12px] font-bold tracking-wider text-slate-900">{plate}</span>
    </span>
  );
}

export function Avatar({
  initials,
  size = "md",
  tone = "dark",
}: {
  initials: string;
  size?: "sm" | "md" | "lg";
  tone?: "dark" | "brand" | "light";
}) {
  const sizes = { sm: "size-7 text-[11px]", md: "size-9 text-xs", lg: "size-12 text-sm" };
  const tones = {
    dark: "bg-slate-900 text-white",
    brand: "bg-brand-600 text-white",
    light: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
  };
  return (
    <span className={`grid shrink-0 place-items-center rounded-full font-semibold ${sizes[size]} ${tones[tone]}`}>
      {initials}
    </span>
  );
}

export function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-slate-300 bg-white/60 p-10 text-center">
      <p className="font-semibold text-slate-800">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ProgressBar({ value, className = "", tone = "brand" }: { value: number; className?: string; tone?: "brand" | "blue" }) {
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-slate-100 ${className}`}>
      <div
        className={`anim-bar h-full rounded-full ${tone === "blue" ? "bg-blue-600" : "bg-gradient-to-r from-brand-500 to-brand-700"}`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function OkRecToggle({
  value,
  onChange,
}: {
  value: "ok" | "rec" | null;
  onChange: (v: "ok" | "rec") => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {(["ok", "rec"] as const).map((v) => {
        const active = value === v;
        const on = v === "ok" ? "bg-emerald-500 text-white ring-emerald-500" : "bg-amber-400 text-slate-950 ring-amber-400";
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={`flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-bold ring-2 transition active:scale-[0.98] ${
              active ? on : "bg-white text-slate-600 ring-slate-200 hover:ring-slate-300"
            }`}
          >
            <span className={`size-3 rounded-sm ${v === "ok" ? "bg-emerald-500" : "bg-amber-400"} ${active ? "ring-2 ring-white" : ""}`} />
            {v === "ok" ? "OK" : "Rec"}
          </button>
        );
      })}
    </div>
  );
}

export function InfoPanel({
  title,
  text,
  tip,
  tone = "blue",
}: {
  title: string;
  text: string;
  tip?: string;
  tone?: "blue" | "amber" | "slate" | "emerald";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-900 ring-blue-200",
    amber: "bg-amber-50 text-amber-900 ring-amber-200",
    slate: "bg-slate-50 text-slate-800 ring-slate-200",
    emerald: "bg-emerald-50 text-emerald-900 ring-emerald-200",
  };
  return (
    <div className={`rounded-2xl p-4 ring-1 ${tones[tone]}`}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-white/80">
          <Info className="size-4" />
        </span>
        <div>
          <p className="font-semibold">{title}</p>
          <p className="mt-1 text-sm leading-relaxed opacity-90">{text}</p>
          {tip && <p className="mt-2 text-xs font-medium opacity-80">Tip: {tip}</p>}
        </div>
      </div>
    </div>
  );
}

export function JourneyCard({
  index,
  title,
  text,
  tip,
  className = "",
}: {
  index: number;
  title: string;
  text: string;
  tip?: string;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl bg-white p-4 ring-1 ring-slate-200 ${className}`}>
      <div className="flex items-start gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-600 text-sm font-black text-white">{index}</span>
        <div>
          <p className="font-semibold text-slate-950">{title}</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">{text}</p>
          {tip && <p className="mt-2 text-xs font-medium text-brand-700">Tip: {tip}</p>}
        </div>
      </div>
    </div>
  );
}

export function OnboardingBanner({
  title,
  text,
  points,
}: {
  title: string;
  text: string;
  points?: string[];
}) {
  return (
    <div className="anim-fade-up overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-brand-950 text-white shadow-xl">
      <div className="flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-300">
            <Sparkles className="size-3.5" /> First-time user guide
          </p>
          <h2 className="mt-2 text-xl font-bold sm:text-2xl">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-300 sm:text-base">{text}</p>
        </div>
        {points && points.length > 0 && (
          <ul className="grid gap-2 text-sm text-slate-200 lg:max-w-md">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-2">
                <span className="mt-1 size-2 shrink-0 rounded-full bg-brand-400" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200/70 ${className}`} />;
}

export function PageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <div className="space-y-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-8 w-72" />
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-56" />
        <Skeleton className="h-56" />
      </div>
    </div>
  );
}

export const inputCls =
  "h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3.5 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15";

export const labelCls = "mb-1.5 block text-sm font-medium text-slate-700";

export const btn = {
  primary:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98] disabled:opacity-60",
  dark: "inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.98]",
  brand:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 active:scale-[0.98]",
  green:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98]",
  outline:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 transition hover:bg-slate-50 active:scale-[0.98]",
  ghost:
    "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900",
};
