"use client";

import { useState } from "react";
import { AlertTriangle, ArrowLeft, Download, RefreshCw, RotateCcw } from "lucide-react";
import { CastleLogo } from "@/components/brand";
import { getRecoveryBackup, resetDemo } from "@/lib/store";

export function RecoveryScreen({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [confirm, setConfirm] = useState(false);

  function restoreSamples() {
    // Only runs after explicit confirmation. No other site's data is cleared.
    resetDemo();
    setConfirm(false);
    reset();
  }

  function downloadOriginal() {
    const backup = getRecoveryBackup();
    if (!backup) return;
    const url = URL.createObjectURL(new Blob([backup], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "castle-demo-recovery-backup.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <main className="grid min-h-[80dvh] place-items-center bg-slate-100 p-5 text-slate-900">
      <section className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-xl ring-1 ring-slate-200 sm:p-9">
        <CastleLogo className="mb-7 h-12 w-auto" />
        <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-200">
          <AlertTriangle className="size-6" />
        </span>
        <h1 className="text-2xl font-bold tracking-tight">Let’s get you back to the shop</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          This view hit an unexpected error. Try again, or reload to fetch the latest app files. Your browser’s saved demo data won’t be cleared by either action.
        </p>
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={reset} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white hover:bg-blue-700">
            <RefreshCw className="size-4" /> Try again
          </button>
          <button type="button" onClick={() => window.location.reload()} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-bold text-white hover:bg-slate-800">
            <RotateCcw className="size-4" /> Reload app
          </button>
        </div>
        <a href="/dashboard" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:underline">
          <ArrowLeft className="size-4" /> Back to dashboard
        </a>
        <details className="mt-6 border-t border-slate-100 pt-4">
          <summary className="cursor-pointer text-xs font-semibold text-slate-500">Still stuck? Demo recovery options</summary>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            Restoring sample data replaces only this app’s demo records in this browser. It does not affect a database, and it does not clear other sites’ storage.
          </p>
          {getRecoveryBackup() && (
            <button type="button" onClick={downloadOriginal} className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-blue-600">
              <Download className="size-3.5" /> Download saved recovery backup
            </button>
          )}
          {confirm ? (
            <div className="mt-3 rounded-xl bg-red-50 p-3 ring-1 ring-red-200">
              <p className="text-xs font-semibold text-red-800">Replace this browser’s demo records with fresh sample data?</p>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={restoreSamples} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white">Yes, restore sample data</button>
                <button type="button" onClick={() => setConfirm(false)} className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-700 ring-1 ring-slate-200">Cancel</button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirm(true)} className="mt-3 text-xs font-semibold text-red-700 hover:underline">Restore sample data…</button>
          )}
        </details>
        {error.digest && <p className="mt-4 font-mono text-[10px] text-slate-400">Support reference: {error.digest}</p>}
        <p className="mt-6 text-[11px] text-slate-400">Castle Tire Shop · Demo mode · No database connection</p>
      </section>
    </main>
  );
}
