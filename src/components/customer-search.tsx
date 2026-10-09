"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Car, Mail, MessageSquare, Phone, Search, X } from "lucide-react";
import { Avatar, Card, EmptyState } from "@/components/ui";
import type { Customer, Vehicle } from "@/lib/data";
import { formatDate, smsLink, telLink, vehicleLabel } from "@/lib/utils";

export type CustomerRow = {
  customer: Customer;
  vehicles: Vehicle[];
  visits: number;
  lastVisit: string | null;
};

export function CustomerSearch({ rows }: { rows: CustomerRow[] }) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"all" | "name" | "phone" | "plate">("all");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    const digits = q.replace(/\D/g, "");
    const plate = q.replace(/[^a-z0-9]/g, "");
    return rows.filter(({ customer, vehicles }) => {
      const nameMatch = customer.name.toLowerCase().includes(q);
      const phoneMatch = digits.length >= 3 && customer.phone.replace(/\D/g, "").includes(digits);
      const plateMatch = plate.length >= 2 && vehicles.some((v) => v.plate.toLowerCase().includes(plate));
      if (mode === "name") return nameMatch;
      if (mode === "phone") return phoneMatch;
      if (mode === "plate") return plateMatch;
      return nameMatch || phoneMatch || plateMatch;
    });
  }, [rows, query, mode]);

  const modes: { id: typeof mode; label: string }[] = [
    { id: "all", label: "All" },
    { id: "name", label: "Name" },
    { id: "phone", label: "Phone" },
    { id: "plate", label: "License plate" },
  ];

  return (
    <div className="space-y-5">
      <Card className="anim-fade-up p-4 sm:p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={mode === "plate" ? "Type a plate, e.g. 4TXR82" : mode === "phone" ? "Type phone, e.g. 508 555" : "Search by name, phone or plate"}
            className="h-13 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-12 text-base outline-none transition focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/15"
            style={{ height: "3.25rem" }}
            aria-label="Search customers"
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700">
              <X className="size-4" />
            </button>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${mode === m.id ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {m.label}
            </button>
          ))}
          <span className="ml-auto self-center text-xs text-slate-500">{results.length} of {rows.length} customers</span>
        </div>
      </Card>

      {results.length === 0 ? (
        <EmptyState title="No matching customers" text="Check the spelling, or try a different phone number or plate." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {results.map(({ customer, vehicles, visits, lastVisit }, i) => (
            <Card key={customer.id} className="anim-fade-up flex flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-md" >
              <div style={{ animationDelay: `${i * 0.03}s` }} className="flex h-full flex-col">
                <div className="flex items-start gap-3">
                  <Avatar initials={customer.name.split(" ").map((p) => p[0]).slice(0, 2).join("")} tone="amber" size="lg" />
                  <div className="min-w-0 flex-1">
                    <Link href={`/customers/${customer.id}`} className="block truncate text-lg font-semibold text-slate-950 hover:text-amber-700">
                      {customer.name}
                    </Link>
                    <p className="text-sm text-slate-500">{customer.city} · Customer since {customer.since}</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-1.5 text-sm text-slate-700">
                  <span className="flex items-center gap-2"><Phone className="size-4 text-slate-400" />{customer.phone}</span>
                  <span className="flex items-center gap-2 truncate"><Mail className="size-4 text-slate-400" />{customer.email}</span>
                </div>

                <div className="mt-4 space-y-2">
                  {vehicles.map((v) => (
                    <Link key={v.id} href={`/customers/${customer.id}#vehicle-${v.id}`} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-100 transition hover:bg-amber-50/60">
                      <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-slate-800">
                        <Car className="size-4 shrink-0 text-slate-400" />
                        <span className="truncate">{vehicleLabel(v)}</span>
                      </span>
                      <span className="shrink-0 rounded bg-slate-950 px-2 py-0.5 font-mono text-xs tracking-wider text-amber-300">{v.plate}</span>
                    </Link>
                  ))}
                </div>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
                  <span className="text-xs text-slate-500">
                    {visits} visit{visits === 1 ? "" : "s"}{lastVisit ? ` · last ${formatDate(lastVisit)}` : ""}
                  </span>
                  <div className="flex gap-2">
                    <a href={telLink(customer.phone)} aria-label={`Call ${customer.name}`} className="grid size-10 place-items-center rounded-xl bg-emerald-600 text-white transition hover:bg-emerald-700"><Phone className="size-4" /></a>
                    <a href={smsLink(customer.phone, `Hi ${customer.name.split(" ")[0]}, this is Castle Tire Shop.`)} aria-label={`Text ${customer.name}`} className="grid size-10 place-items-center rounded-xl bg-slate-950 text-white transition hover:bg-slate-800"><MessageSquare className="size-4" /></a>
                    <Link href={`/customers/${customer.id}`} className="inline-flex h-10 items-center rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-800 transition hover:border-amber-300 hover:bg-amber-50/60">History</Link>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
