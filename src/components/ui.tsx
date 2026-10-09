import type { ReactNode } from "react";
import type { CheckStatus } from "@/lib/data";
import { STAGES } from "@/lib/data";
import { statusMeta } from "@/lib/utils";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80 ${className}`}>{children}</div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="anim-fade-up flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-600">{eyebrow}</p>}
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatusBadge({ status, className = "" }: { status: CheckStatus; className?: string }) {
  const meta = statusMeta(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${meta.badge} ${className}`}
    >
      <span className={`size-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

export function StatusDot({ status }: { status: CheckStatus }) {
  return <span className={`inline-block size-3 rounded-full ring-2 ring-white ${statusMeta(status).dot}`} />;
}

export function ProgressBar({ value, className = "" }: { value: number; className?: string }) {
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-slate-100 ${className}`}>
      <div
        className="anim-bar h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function StageTracker({ stage }: { stage: number }) {
  const pct = (stage / (STAGES.length - 1)) * 100;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-900">{STAGES[stage]}</span>
        <span className="text-slate-500">
          Step {stage + 1} of {STAGES.length}
        </span>
      </div>
      <ProgressBar value={pct} />
      <div className="mt-2 hidden grid-cols-6 gap-1 text-[10px] leading-tight text-slate-500 sm:grid">
        {STAGES.map((s, i) => (
          <span key={s} className={i <= stage ? "font-medium text-slate-800" : ""}>
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Avatar({ initials, size = "md", tone = "slate" }: { initials: string; size?: "sm" | "md" | "lg"; tone?: "slate" | "amber" }) {
  const sizes = { sm: "size-7 text-[11px]", md: "size-9 text-xs", lg: "size-12 text-sm" };
  const tones = {
    slate: "bg-slate-900 text-white",
    amber: "bg-gradient-to-br from-amber-300 to-orange-500 text-slate-900",
  };
  return (
    <span className={`grid shrink-0 place-items-center rounded-full font-semibold ${sizes[size]} ${tones[tone]}`}>
      {initials}
    </span>
  );
}

export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-slate-300 bg-white/60 p-10 text-center">
      <p className="font-semibold text-slate-800">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{text}</p>
    </div>
  );
}
