"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Pencil,
  Plus,
  Search,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { Donut } from "@/components/analytics";
import { Toast, useToast } from "@/components/toast";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { HelpTip } from "@/components/onboarding";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_METHODS,
  INCOME_CATEGORIES,
  type ExpenseMethod,
  type ExpenseTransaction,
  type ExpenseType,
} from "@/lib/data";
import { addExpense, removeExpense, updateExpense, useMe, useShop } from "@/lib/store";
import { expenseDaily, expenseSummary, type ExpenseRange } from "@/lib/insights";
import { byId, fmtShortDate, money, nowISO, relDay, todayISO, vehicleLabel } from "@/lib/utils";

const RANGES: { id: ExpenseRange; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "7 days" },
  { id: "month", label: "30 days" },
  { id: "all", label: "All" },
];

const CAT_COLORS = ["#10b981", "#2563eb", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#64748b", "#84cc16", "#f97316"];

export default function ExpensesPage() {
  const state = useShop();
  const me = useMe();
  const [toast, showToast] = useToast();
  const [range, setRange] = useState<ExpenseRange>("month");
  const [typeFilter, setTypeFilter] = useState<"all" | ExpenseType>("all");
  const [catFilter, setCatFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<null | { mode: "add"; preset?: ExpenseType } | { mode: "edit"; entry: ExpenseTransaction }>(null);
  const [confirmDelete, setConfirmDelete] = useState<ExpenseTransaction | null>(null);

  const summary = useMemo(() => expenseSummary(state, range), [state, range]);
  const daily = useMemo(() => expenseDaily(state, 14), [state]);

  const categories = typeFilter === "income" ? INCOME_CATEGORIES : typeFilter === "expense" ? EXPENSE_CATEGORIES : [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return summary.list.filter((x) => {
      if (typeFilter !== "all" && x.type !== typeFilter) return false;
      if (catFilter !== "all" && x.category !== catFilter) return false;
      if (!q) return true;
      const job = x.jobId ? byId(state.jobs, x.jobId) : undefined;
      const c = job ? byId(state.customers, job.customerId) : undefined;
      return `${x.description} ${x.category} ${x.id} ${c?.name ?? ""} ${x.jobId ?? ""}`.toLowerCase().includes(q);
    });
  }, [summary.list, typeFilter, catFilter, query, state]);

  const exportCsv = () => {
    const header = "ID,Date,Type,Category,Description,Amount,Method,Job,By";
    const lines = visible.map((x) =>
      [x.id, x.date, x.type, x.category, x.description, x.amount, x.method, x.jobId ?? "", byId(state.team, x.by)?.name ?? x.by]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses-${range}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast(`Exported ${visible.length} transactions to CSV.`);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Shop money"
        title={
          <span>
            Expenses
            <HelpTip title="Money in vs money out">
              Green = income (what customers paid). Red = expenses (what the shop spent). Net = what you kept. Add every cash and card movement here.
            </HelpTip>
          </span>
        }
        subtitle="Track incoming and outgoing money. Dummy data — add, edit, delete freely."
        actions={
          <>
            <button type="button" onClick={exportCsv} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
              <Download className="size-4" /> Export CSV
            </button>
            <button type="button" onClick={() => setModal({ mode: "add", preset: "expense" })} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700">
              <Plus className="size-4" /> Add expense
            </button>
            <button type="button" onClick={() => setModal({ mode: "add", preset: "income" })} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
              <Plus className="size-4" /> Add income
            </button>
          </>
        }
      />

      <div className="flex w-fit rounded-full bg-white p-1 ring-1 ring-slate-200">
        {RANGES.map((r) => (
          <button key={r.id} type="button" onClick={() => setRange(r.id)} className={`h-9 rounded-full px-4 text-sm font-semibold transition ${range === r.id ? "bg-slate-950 text-white" : "text-slate-600"}`}>
            {r.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="border-l-4 border-l-emerald-500 p-4">
          <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-700"><ArrowDownLeft className="size-3.5" /> Income in</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{money(summary.income)}</p>
          <p className="text-xs text-slate-500">{summary.list.filter((x) => x.type === "income").length} transactions</p>
        </Card>
        <Card className="border-l-4 border-l-red-500 p-4">
          <p className="flex items-center gap-1.5 text-xs font-bold text-red-700"><ArrowUpRight className="size-3.5" /> Expenses out</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{money(summary.expense)}</p>
          <p className="text-xs text-slate-500">{summary.list.filter((x) => x.type === "expense").length} transactions</p>
        </Card>
        <Card className={`border-l-4 p-4 ${summary.net >= 0 ? "border-l-blue-500" : "border-l-amber-500"}`}>
          <p className="flex items-center gap-1.5 text-xs font-bold text-slate-600"><Wallet className="size-3.5" /> Net kept</p>
          <p className={`mt-1 text-2xl font-bold ${summary.net >= 0 ? "text-slate-950" : "text-amber-600"}`}>{money(summary.net)}</p>
          <p className="text-xs text-slate-500">{summary.income ? `${Math.round((summary.net / Math.max(1, summary.income)) * 100)}% margin` : "—"}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">Biggest expense</p>
          {summary.expenseByCat[0] ? (
            <>
              <p className="mt-1 truncate text-lg font-bold text-slate-950">{summary.expenseByCat[0].label}</p>
              <p className="text-sm font-bold text-red-600">{money(summary.expenseByCat[0].value)}</p>
            </>
          ) : (
            <p className="mt-1 text-lg font-bold text-slate-400">—</p>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr]">
        <Card className="p-4 sm:p-5">
          <h2 className="text-sm font-bold text-slate-900">Cash flow · last 14 days</h2>
          <p className="text-xs text-slate-500">Green bars = in · red bars = out</p>
          <div className="mt-4 flex h-32 items-end gap-1">
            {daily.map((d) => {
              const max = Math.max(1, ...daily.flatMap((x) => [x.income, x.expense]));
              return (
                <div key={d.date} className="flex min-w-0 flex-1 flex-col items-center gap-1" title={`${d.date}: +${money(d.income)} / −${money(d.expense)}`}>
                  <div className="flex h-24 w-full items-end justify-center gap-0.5">
                    <div className="w-full max-w-3 rounded-t bg-emerald-500" style={{ height: `${Math.max(4, (d.income / max) * 100)}%` }} />
                    <div className="w-full max-w-3 rounded-t bg-red-500" style={{ height: `${Math.max(4, (d.expense / max) * 100)}%` }} />
                  </div>
                  <span className="text-[9px] font-bold text-slate-400">{d.label}</span>
                </div>
              );
            })}
          </div>
        </Card>
        <Card className="p-4 sm:p-5">
          <h2 className="text-sm font-bold text-slate-900">Where money goes</h2>
          <div className="mt-3">
            {summary.expenseByCat.length === 0 ? (
              <p className="text-sm text-slate-400">No expenses in range.</p>
            ) : (
              <Donut parts={summary.expenseByCat.slice(0, 6).map((c, i) => ({ ...c, color: CAT_COLORS[i % CAT_COLORS.length] }))} size={110} />
            )}
          </div>
        </Card>
        <Card className="p-4 sm:p-5">
          <h2 className="text-sm font-bold text-slate-900">Where money comes from</h2>
          <div className="mt-3">
            {summary.incomeByCat.length === 0 ? (
              <p className="text-sm text-slate-400">No income in range.</p>
            ) : (
              <Donut parts={summary.incomeByCat.slice(0, 6).map((c, i) => ({ ...c, color: CAT_COLORS[i % CAT_COLORS.length] }))} size={110} />
            )}
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative w-full lg:max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search description, job, customer…" className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15" />
        </div>
        <div className="flex w-fit rounded-full bg-white p-1 ring-1 ring-slate-200">
          {(["all", "income", "expense"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTypeFilter(t);
                setCatFilter("all");
              }}
              className={`h-8 rounded-full px-4 text-xs font-bold capitalize transition ${typeFilter === t ? (t === "income" ? "bg-emerald-600 text-white" : t === "expense" ? "bg-red-600 text-white" : "bg-slate-950 text-white") : "text-slate-600"}`}
            >
              {t === "all" ? "All" : t === "income" ? "↓ Income" : "↑ Expenses"}
            </button>
          ))}
        </div>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} aria-label="Filter by category" className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600">
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <span className="text-xs text-slate-500">{visible.length} of {summary.list.length} shown</span>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title="No transactions here"
          text="Try another range or filter — or add your first entry."
          action={
            <button type="button" onClick={() => setModal({ mode: "add", preset: "expense" })} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">
              <Plus className="size-4" /> Add transaction
            </button>
          }
        />
      ) : (
        <Card className="anim-fade-up overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {visible.map((x) => {
              const job = x.jobId ? byId(state.jobs, x.jobId) : undefined;
              const v = job ? byId(state.vehicles, job.vehicleId) : undefined;
              const who = byId(state.team, x.by);
              const isIn = x.type === "income";
              return (
                <li key={x.id} className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-slate-50/80 sm:px-5">
                  <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${isIn ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                    {isIn ? <ArrowDownLeft className="size-5" /> : <ArrowUpRight className="size-5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900">{x.description}</p>
                    <p className="truncate text-xs text-slate-500">
                      {x.category} · {relDay(x.date, state.anchorDay)} {fmtShortDate(x.date)} · {EXPENSE_METHODS.find((m) => m.id === x.method)?.label ?? x.method}
                      {who ? ` · ${who.name.split(" ")[0]}` : ""}
                      {job ? ` · ${job.id}` : ""}{v ? ` · ${vehicleLabel(v)}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`text-base font-bold ${isIn ? "text-emerald-600" : "text-red-600"}`}>
                      {isIn ? "+" : "−"}{money(x.amount, true)}
                    </span>
                    {job && (
                      <Link href={`/jobs/${job.id}`} className="hidden rounded-lg bg-slate-100 px-2 py-1 font-mono text-[11px] font-bold text-slate-600 hover:bg-slate-200 sm:inline">
                        {job.id}
                      </Link>
                    )}
                    <button type="button" onClick={() => setModal({ mode: "edit", entry: x })} aria-label="Edit" className="grid size-9 place-items-center rounded-lg text-slate-400 ring-1 ring-slate-200 hover:bg-slate-100 hover:text-slate-700">
                      <Pencil className="size-4" />
                    </button>
                    <button type="button" onClick={() => setConfirmDelete(x)} aria-label="Delete" className="grid size-9 place-items-center rounded-lg text-slate-400 ring-1 ring-slate-200 hover:bg-red-50 hover:text-red-600">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {modal && (
        <ExpenseModal
          key={modal.mode === "edit" ? modal.entry.id : `add-${modal.preset}`}
          initial={
            modal.mode === "edit"
              ? modal.entry
              : { type: modal.preset ?? "expense", date: state.anchorDay, category: "", description: "", amount: 0, method: "cash" as ExpenseMethod, jobId: "" }
          }
          meId={me.id}
          onClose={() => setModal(null)}
          onSaved={(msg) => {
            setModal(null);
            showToast(msg);
          }}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/60 p-4" role="dialog" aria-modal="true">
          <div className="anim-fade-up w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <h2 className="font-bold text-slate-950">Delete this transaction?</h2>
            <p className="mt-1 text-sm text-slate-600">{confirmDelete.description} · {money(confirmDelete.amount, true)}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setConfirmDelete(null)} className="h-11 rounded-xl bg-slate-100 font-bold text-slate-700">Keep</button>
              <button
                type="button"
                onClick={() => {
                  removeExpense(confirmDelete.id);
                  setConfirmDelete(null);
                  showToast("Transaction deleted.");
                }}
                className="h-11 rounded-xl bg-red-600 font-bold text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      <Toast toast={toast} />
    </div>
  );
}

type Draft = {
  type: ExpenseType;
  date: string;
  category: string;
  description: string;
  amount: number;
  method: ExpenseMethod;
  jobId: string;
};

function ExpenseModal({
  initial,
  meId,
  onClose,
  onSaved,
}: {
  initial: ExpenseTransaction | Draft;
  meId: string;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const state = useShop();
  const isEdit = "id" in initial;
  const [form, setForm] = useState<Draft>(
    isEdit
      ? { type: initial.type, date: initial.date, category: initial.category, description: initial.description, amount: initial.amount, method: initial.method, jobId: initial.jobId ?? "" }
      : { ...(initial as Draft), category: (initial as Draft).category || ((initial as Draft).type === "income" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]) },
  );
  const [error, setError] = useState("");

  const cats = form.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const save = () => {
    if (!form.description.trim()) return setError("Add a short description (e.g. “Brake job — F-150”).");
    if (!form.amount || form.amount <= 0) return setError("Amount must be more than $0.");
    if (!form.date) return setError("Pick a date.");
    const at = form.date === todayISO() ? nowISO() : `${form.date}T12:00:00`;
    if (isEdit) {
      updateExpense((initial as ExpenseTransaction).id, {
        type: form.type,
        date: form.date,
        at,
        category: form.category,
        description: form.description.trim(),
        amount: Math.round(form.amount * 100) / 100,
        method: form.method,
        jobId: form.jobId || undefined,
      });
      onSaved("Transaction updated.");
    } else {
      addExpense({
        type: form.type,
        date: form.date,
        at,
        category: form.category,
        description: form.description.trim(),
        amount: Math.round(form.amount * 100) / 100,
        method: form.method,
        jobId: form.jobId || undefined,
        by: meId,
      });
      onSaved(form.type === "income" ? "Income recorded. 💰" : "Expense recorded.");
    }
  };

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-slate-950/60 p-4" role="dialog" aria-modal="true">
      <div className="anim-fade-up w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-600">{isEdit ? "Edit" : "New"} transaction</p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">{isEdit ? "Fix the details" : form.type === "income" ? "Money in 💰" : "Money out 💸"}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-9 place-items-center rounded-full hover:bg-slate-100"><X className="size-5" /></button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
          {(["income", "expense"] as ExpenseType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setForm((f) => ({ ...f, type: t, category: t === "income" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0] }))}
              className={`h-11 rounded-lg text-sm font-black transition ${form.type === t ? (t === "income" ? "bg-emerald-600 text-white shadow" : "bg-red-600 text-white shadow") : "text-slate-500"}`}
            >
              {t === "income" ? "↓ Income in" : "↑ Expense out"}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-slate-600">Description *</span>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={form.type === "income" ? "Brake job — F-150 labor" : "Brake parts — NAPA"} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-600">Amount ($) *</span>
              <input type="number" min={0} step="0.01" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) || 0 })} placeholder="0.00" className="h-11 w-full rounded-xl border border-slate-200 px-3 text-lg font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-600">Date *</span>
              <input type="date" value={form.date} max={todayISO()} onChange={(e) => setForm({ ...form, date: e.target.value })} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15" />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-600">Category</span>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-2 text-sm">
                {cats.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-600">Paid via</span>
              <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value as ExpenseMethod })} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-2 text-sm">
                {EXPENSE_METHODS.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-slate-600">Linked job (optional)</span>
            <select value={form.jobId} onChange={(e) => setForm({ ...form, jobId: e.target.value })} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-2 text-sm">
              <option value="">No job — shop overhead / walk-in</option>
              {state.jobs.slice(0, 30).map((j) => {
                const v = byId(state.vehicles, j.vehicleId);
                return (
                  <option key={j.id} value={j.id}>{j.id} · {v ? vehicleLabel(v) : ""}</option>
                );
              })}
            </select>
          </label>
          {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700 ring-1 ring-red-200">{error}</p>}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button type="button" onClick={onClose} className="h-12 rounded-xl bg-slate-100 font-bold text-slate-700">Cancel</button>
            <button type="button" onClick={save} className={`h-12 rounded-xl font-black text-white ${form.type === "income" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}`}>
              {isEdit ? "Save changes" : form.type === "income" ? "Record income" : "Record expense"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
