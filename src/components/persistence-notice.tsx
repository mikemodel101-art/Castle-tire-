"use client";

import { AlertTriangle, Download, ShieldCheck, X } from "lucide-react";
import { dismissPersistenceNotice, getRecoveryBackup, usePersistenceNotice } from "@/lib/store";

export function PersistenceNotice() {
  const notice = usePersistenceNotice();
  if (!notice) return null;
  const recovered = notice === "recovered";
  const session = notice === "session";
  const backup = recovered ? getRecoveryBackup() : null;

  function downloadBackup() {
    const raw = getRecoveryBackup();
    if (!raw) return;
    const url = URL.createObjectURL(new Blob([raw], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "castle-demo-save-before-recovery.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div role="status" className={`mb-5 flex items-start gap-3 rounded-2xl p-4 text-sm ring-1 print:hidden ${session ? "bg-amber-50 text-amber-900 ring-amber-200" : "bg-blue-50 text-blue-900 ring-blue-200"}`}>
      {session ? <AlertTriangle className="mt-0.5 size-5 shrink-0" /> : <ShieldCheck className="mt-0.5 size-5 shrink-0" />}
      <div className="min-w-0 flex-1">
        <p className="font-bold">{session ? "Session-only demo mode" : recovered ? "Your demo save has been recovered" : "Demo data upgraded successfully"}</p>
        <p className="mt-0.5 text-xs leading-relaxed">
          {session
            ? "This browser is blocking storage, or its storage is full. The app still works without a database; changes will stay in memory for this session."
            : recovered
              ? "An incomplete or outdated browser save was repaired. Valid records were kept and missing data was filled with safe sample data."
              : "Your older demo records were kept and upgraded for the current app, including expense tracking."}
        </p>
        {backup && (
          <button type="button" onClick={downloadBackup} className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold underline underline-offset-4">
            <Download className="size-3.5" /> Download the original save
          </button>
        )}
      </div>
      <button type="button" onClick={dismissPersistenceNotice} aria-label="Dismiss storage notice" className="grid size-8 shrink-0 place-items-center rounded-full transition hover:bg-black/5">
        <X className="size-4" />
      </button>
    </div>
  );
}
