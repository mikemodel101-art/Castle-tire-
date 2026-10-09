"use client";

import type { ReactNode } from "react";
import { Card } from "./ui";

export function StatCard({
  label,
  value,
  hint,
  tone = "text-slate-950",
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: string;
  icon?: ReactNode;
}) {
  return (
    <Card className="anim-fade-up p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        {icon}
      </div>
      <p className={`mt-1 text-2xl font-bold tracking-tight ${tone}`}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
    </Card>
  );
}

export function MiniBars({ data, valueLabel }: { data: { label: string; value: number }[]; valueLabel?: (v: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex h-28 items-end gap-1.5">
      {data.map((d, i) => (
        <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-1" title={valueLabel ? valueLabel(d.value) : String(d.value)}>
          <div className="flex h-20 w-full items-end rounded-lg bg-slate-50 ring-1 ring-slate-100">
            <div
              className="anim-bar w-full rounded-lg bg-gradient-to-t from-brand-600 to-brand-400"
              style={{ height: `${Math.max(6, (d.value / max) * 100)}%`, animationDelay: `${i * 0.05}s` }}
            />
          </div>
          <span className="text-[10px] font-bold text-slate-500">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function Donut({ parts, size = 120 }: { parts: { value: number; color: string; label: string }[]; size?: number }) {
  const total = Math.max(1, parts.reduce((s, p) => s + p.value, 0));
  let acc = 0;
  const segs = parts.map((p) => {
    const from = (acc / total) * 360;
    acc += p.value;
    const to = (acc / total) * 360;
    return `${p.color} ${from}deg ${to}deg`;
  });
  return (
    <div className="flex items-center gap-4">
      <div
        className="shrink-0 rounded-full"
        style={{
          width: size,
          height: size,
          background: `conic-gradient(${segs.join(",")})`,
          mask: "radial-gradient(circle, transparent 52%, black 53%)",
          WebkitMask: "radial-gradient(circle, transparent 52%, black 53%)",
        }}
        role="img"
        aria-label={parts.map((p) => `${p.label}: ${p.value}`).join(", ")}
      />
      <ul className="space-y-1.5 text-xs">
        {parts.map((p) => (
          <li key={p.label} className="flex items-center gap-2 text-slate-600">
            <span className="size-2.5 rounded-full" style={{ background: p.color }} />
            <span className="font-semibold text-slate-900">{p.value}</span> {p.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Funnel({ steps }: { steps: { label: string; value: number; color: string }[] }) {
  const max = Math.max(1, ...steps.map((s) => s.value));
  return (
    <div className="space-y-2">
      {steps.map((s) => (
        <div key={s.label} className="flex items-center gap-2 text-xs">
          <span className="w-20 shrink-0 font-semibold text-slate-600">{s.label}</span>
          <div className="h-6 flex-1 overflow-hidden rounded-lg bg-slate-100">
            <div className="anim-bar flex h-full items-center justify-end rounded-lg px-2 font-bold text-white" style={{ width: `${Math.max(8, (s.value / max) * 100)}%`, background: s.color }}>
              {s.value > 0 && s.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Legend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <div className="flex flex-wrap gap-3 text-xs text-slate-600">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full" style={{ background: i.color }} /> {i.label}
        </span>
      ))}
    </div>
  );
}
