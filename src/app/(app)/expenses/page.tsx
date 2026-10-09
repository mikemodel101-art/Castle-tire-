"use client";

import { useMemo, useState, type FormEvent } from "react";
import { ArrowDownCircle, ArrowUpCircle, Plus, Trash2, Wallet } from "lucide-react";
import { Card, EmptyState, InfoPanel, OnboardingBanner, PageHeader, inputCls, labelCls } from "@/components/ui";
import type { ExpenseCategory, ExpenseEntry, ExpenseType } from "@/lib/data";
import { APP_JOURNEY } from "@/lib/help";
import { EXPENSE_CATEGORY_GROUPS, EXPENSE_CATEGORY_LABEL, netCashflow, sumByType } from "@/lib/finance";
import { addExpense, removeExpense, useMe, useShop } from "@/lib/store";
import { byId, fmtShortDate, money } from "@/lib/utils";

type Filter = "all" | ExpenseType;

type FormState = {
  type: ExpenseType;
  category: ExpenseCategory;
  title: string;
  amount: string;
  date: string;
  note: string;
  vendor: string;
  method: "cash" | "card" | "bank" | "check" | "other";
};

const methods: FormState["method"][] = ["cash", "card", "bank", "check", "other"];

export default function ExpensesPage() {
  const state = useShop();
  const me = useMe();
  const [filter, setFilter] = useState<Filter>("all");
  const [form, setForm] = useState<FormState>({
    type: "expense",
    category: "parts_purchase",
    title: "",
    amount: "",
    date: state.anchorDay,
    note: "",
    vendor: "",
    method: "card",
  });

  const rows = useMemo(
    () => [...state.expenses].filter((x) => (filter === "all" ? true : x.type === filter)).sort((a, b) => b.date.localeCompare(a.date)),
    [state.expenses, filter],
  );

  const income = sumByType(state.expenses, "income");
  const expense = sumByType(state.expenses, "expense");
  const net = netCashflow(state.expenses);

  const categoryOptions = EXPENSE_CATEGORY_GROUPS.find((g) => g.type === form.type)?.categories ?? [];

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.amount) return;
    addExpense({
      type: form.type,
      category: form.category,
      title: form.title.trim(),
      amount: Number(form.amount) || 0,
      date: form.date,
      note: form.note.trim(),
      vendor: form.vendor.trim() || undefined,
      method: form.method,
      createdBy: me.id,
    });
    setForm({
      type: form.type,
      category: EXPENSE_CATEGORY_GROUPS.find((g) => g.type === form.type)?.categories[0] ?? "other",
      title: "",
      amount: "",
      date: state.anchorDay,
      note: "",
      vendor: "",
      method: form.method,
    });
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Money in & out"
        title="Expense Tracking"
        subtitle="Track incoming revenue and outgoing shop expenses inside the same app."
      />

      <OnboardingBanner
        title="This page helps the owner understand cash flow"
        text="Use income entries for money coming into the shop and expense entries for money going out. This keeps the owner aware of what the shop earned and spent."
        points={[
          "Income = work sold, labor, tires, or other shop revenue.",
          "Expense = parts purchases, rent, payroll, utilities, tools, marketing and more.",
          "Net cash flow = income minus expenses.",
        ]}
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Card className="anim-fade-up p-4">
              <div className="flex items-center gap-2 text-emerald-700">
                <ArrowUpCircle className="size-4" />
                <p className="text-xs font-semibold uppercase tracking-wide">Incoming</p>
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-950">{money(income, true)}</p>
            </Card>
            <Card className="anim-fade-up p-4">
              <div className="flex items-center gap-2 text-red-700">
                <ArrowDownCircle className="size-4" />
                <p className="text-xs font-semibold uppercase tracking-wide">Outgoing</p>
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-950">{money(expense, true)}</p>
            </Card>
            <Card className="anim-fade-up p-4">
              <div className="flex items-center gap-2 text-blue-700">
                <Wallet className="size-4" />
                <p className="text-xs font-semibold uppercase tracking-wide">Net</p>
              </div>
              <p className={`mt-2 text-2xl font-bold ${net >= 0 ? "text-emerald-700" : "text-red-700"}`}>{money(net, true)}</p>
            </Card>
          </div>

          <div className="flex w-fit rounded-full bg-white p-1 ring-1 ring-slate-200">
            {(["all", "income", "expense"] as Filter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`h-9 rounded-full px-4 text-sm font-semibold transition ${filter === f ? "bg-slate-950 text-white" : "text-slate-600"}`}
              >
                {f === "all" ? "All" : f === "income" ? "Incoming" : "Outgoing"}
              </button>
            ))}
          </div>

          {rows.length === 0 ? (
            <EmptyState title="No entries yet" text="Add your first income or expense entry from the form on the right." />
          ) : (
            <Card className="anim-fade-up overflow-hidden">
              <ul className="divide-y divide-slate-100">
                {rows.map((x) => {
                  const who = byId(state.team, x.createdBy);
                  const customer = x.customerId ? byId(state.customers, x.customerId) : undefined;
                  return (
                    <li key={x.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${x.type === "income" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                            {x.type === "income" ? "Incoming" : "Outgoing"}
                          </span>
                          <span className="text-xs font-medium text-slate-500">{EXPENSE_CATEGORY_LABEL[x.category]}</span>
                        </div>
                        <p className="mt-2 font-semibold text-slate-950">{x.title}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {fmtShortDate(x.date)}
                          {x.vendor ? ` · ${x.vendor}` : ""}
                          {customer ? ` · ${customer.name}` : ""}
                          {x.note ? ` · ${x.note}` : ""}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">Added by {who?.name ?? "Shop"} · {x.method}</p>
                      </div>
                      <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                        <span className={`text-lg font-bold ${x.type === "income" ? "text-emerald-700" : "text-red-700"}`}>
                          {x.type === "income" ? "+" : "-"}{money(x.amount, true)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeExpense(x.id)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="size-3.5" /> Remove
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <InfoPanel
            title="How should the owner use this?"
            text="Put every major sale and every major shop expense here. That gives the owner a simple live view of cash moving in and out of the business."
            tip="In production, this could later sync with invoices, payments and accounting software."
          />

          <Card className="anim-fade-up p-5">
            <h2 className="mb-4 font-semibold text-slate-950">Add entry</h2>
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {(["income", "expense"] as ExpenseType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm((f) => ({
                      ...f,
                      type,
                      category: EXPENSE_CATEGORY_GROUPS.find((g) => g.type === type)?.categories[0] ?? "other",
                    }))}
                    className={`h-11 rounded-xl text-sm font-bold transition ${form.type === type ? type === "income" ? "bg-emerald-600 text-white" : "bg-red-600 text-white" : "bg-slate-100 text-slate-700"}`}
                  >
                    {type === "income" ? "Incoming" : "Outgoing"}
                  </button>
                ))}
              </div>

              <label className="block">
                <span className={labelCls}>Category</span>
                <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as ExpenseCategory }))} className={inputCls}>
                  {categoryOptions.map((c) => (
                    <option key={c} value={c}>{EXPENSE_CATEGORY_LABEL[c]}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className={labelCls}>Title</span>
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder={form.type === "income" ? "Example: Front brake job paid" : "Example: Brake parts restock"} className={inputCls} />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className={labelCls}>Amount</span>
                  <input type="number" min={0} step="0.01" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0.00" className={inputCls} />
                </label>
                <label className="block">
                  <span className={labelCls}>Date</span>
                  <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className={inputCls} />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className={labelCls}>Vendor / source</span>
                  <input value={form.vendor} onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))} placeholder={form.type === "income" ? "Customer / channel" : "Supplier / landlord / utility"} className={inputCls} />
                </label>
                <label className="block">
                  <span className={labelCls}>Method</span>
                  <select value={form.method} onChange={(e) => setForm((f) => ({ ...f, method: e.target.value as FormState["method"] }))} className={inputCls}>
                    {methods.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className={labelCls}>Note</span>
                <textarea value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} rows={3} placeholder="Optional detail for the owner or bookkeeper" className={`${inputCls} h-auto py-3`} />
              </label>

              <button type="submit" className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-semibold text-white hover:bg-slate-800">
                <Plus className="size-4" /> Add entry
              </button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
