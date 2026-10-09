"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

type ToastState = { text: string; n: number } | null;

export function useToast(): [ToastState, (text: string) => void] {
  const [toast, setToast] = useState<ToastState>(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);
  const show = useCallback((text: string) => setToast((prev) => ({ text, n: (prev?.n ?? 0) + 1 })), []);
  return [toast, show];
}

export function Toast({ toast }: { toast: ToastState }) {
  if (!toast) return null;
  return (
    <div
      key={toast.n}
      role="status"
      className="anim-fade-up fixed bottom-24 left-1/2 z-[70] flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-2.5 rounded-xl bg-slate-950 px-4 py-3 text-sm text-white shadow-2xl md:bottom-8 print:hidden"
    >
      <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
      <span>{toast.text}</span>
    </div>
  );
}
