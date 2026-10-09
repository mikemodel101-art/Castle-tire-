"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Mail, MessageSquare, Phone, Plus, Search, X } from "lucide-react";
import { Avatar, Card, EmptyState, PageHeader, PlateBadge } from "@/components/ui";
import { useShop } from "@/lib/store";
import { digits, firstName, initials, relDay, smsHref, telHref, vehicleLabel } from "@/lib/utils";

type Mode = "all" | "name" | "phone" | "plate";

export default function CustomersPage() {
  const state = useShop();
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<Mode>("all");

  const rows = useMemo(
    () =>
      state.customers.map((c) => {
        const vehicles = state.vehicles.filter((v) => v.customerId === c.id);
        const jobs = state.jobs.filter((j) => j.customerId === c.id).sort((a, b) => b.date.localeCompare(a.date));
        return { c, vehicles, jobs };
      }),
    [state],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    const qd = digits(q);
    const plate = q.replace(/[^a-z0-9]/g, "");
    return rows.filter(({ c, vehicles }) => {
      const byName = c.name.toLowerCase().includes(q);
      const byPhone = qd.length >= 3 && digits(c.phone).includes(qd);
      const byPlate = plate.length >= 2 && vehicles.some((v) => v.plate.toLowerCase().includes(plate));
      if (mode === "name") return byName;
      if (mode === "phone") return byPhone;
      if (mode === "plate") return byPlate;
      return byName || byPhone || byPlate;
    });
  }, [rows, query, mode]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Customer & vehicle history"
        title="Customers"
        subtitle="Search by name, phone number or license plate."
        actions={
          <Link href="/jobs/new" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
            <Plus className="size-4" /> New Vehicle
          </Link>
        }
      />

      <Card className="anim-fade-up p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={mode === "plate" ? "Plate, e.g. 3ABC27" : mode === "phone" ? "Phone, e.g. 857 555" : "Name, phone or plate"}
            aria-label="Search customers"
            className="h-13 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-12 text-base outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/15"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-slate-400 hover:bg-slate-200">
              <X className="size-4" />
            </button>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {(["all", "name", "phone", "plate"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${mode === m ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {m === "plate" ? "License plate" : m}
            </button>
          ))}
          <span className="ml-auto text-xs text-slate-500">
            {results.length} of {rows.length} customers
          </span>
        </div>
      </Card>

      {results.length === 0 ? (
        <EmptyState title="No matching customers" text="Check the spelling, or try a different phone number or plate." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {results.map(({ c, vehicles, jobs }) => (
            <Card key={c.id} className="anim-fade-up flex flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start gap-3">
                <Avatar initials={initials(c.name)} tone="brand" size="lg" />
                <div className="min-w-0 flex-1">
                  <Link href={`/customers/${c.id}`} className="block truncate text-lg font-bold text-slate-950 hover:text-blue-600">
                    {c.name}
                  </Link>
                  <p className="text-sm text-slate-500">
                    {c.city} · since {c.since}
                  </p>
                </div>
              </div>
              <div className="mt-4 grid gap-1.5 text-sm text-slate-700">
                <span className="flex items-center gap-2"><Phone className="size-4 text-slate-400" />{c.phone}</span>
                {c.email && <span className="flex items-center gap-2 truncate"><Mail className="size-4 text-slate-400" />{c.email}</span>}
              </div>
              <div className="mt-4 space-y-2">
                {vehicles.map((v) => (
                  <Link
                    key={v.id}
                    href={`/customers/${c.id}#vehicle-${v.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100 transition hover:bg-blue-50/60"
                  >
                    <span className="truncate text-sm font-semibold text-slate-800">{vehicleLabel(v)}</span>
                    <PlateBadge plate={v.plate} />
                  </Link>
                ))}
              </div>
              <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                <span className="text-xs text-slate-500">
                  {jobs.length} visit{jobs.length === 1 ? "" : "s"}
                  {jobs[0] ? ` · last ${relDay(jobs[0].date, state.anchorDay)}` : ""}
                </span>
                <div className="flex gap-2">
                  <a href={telHref(c.phone)} aria-label={`Call ${c.name}`} className="grid size-10 place-items-center rounded-xl bg-emerald-600 text-white hover:bg-emerald-700">
                    <Phone className="size-4" />
                  </a>
                  <a href={smsHref(c.phone, `Hi ${firstName(c.name)}, this is ${state.settings.shopName}.`)} aria-label={`Text ${c.name}`} className="grid size-10 place-items-center rounded-xl bg-slate-950 text-white hover:bg-slate-800">
                    <MessageSquare className="size-4" />
                  </a>
                  <Link href={`/customers/${c.id}`} className="inline-flex h-10 items-center rounded-xl px-3 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50">
                    History
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
