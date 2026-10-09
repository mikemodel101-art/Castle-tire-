"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpDown, Crown, Mail, MessageSquare, Phone, Plus, Search, Sparkles, UserPlus, X } from "lucide-react";
import { Avatar, Card, EmptyState, PageHeader, PlateBadge } from "@/components/ui";
import { HelpTip } from "@/components/onboarding";
import { useShop } from "@/lib/store";
import { customerStats } from "@/lib/insights";
import { digits, firstName, initials, money, relDay, smsHref, telHref, vehicleLabel } from "@/lib/utils";

type Mode = "all" | "name" | "phone" | "plate";
type Segment = "all" | "VIP" | "New" | "Returning" | "At-risk";
type SortKey = "name" | "visits" | "value" | "recent";

export default function CustomersPage() {
  const state = useShop();
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<Mode>("all");
  const [segment, setSegment] = useState<Segment>("all");
  const [sort, setSort] = useState<SortKey>("recent");

  const rows = useMemo(
    () =>
      state.customers.map((c) => {
        const vehicles = state.vehicles.filter((v) => v.customerId === c.id);
        const jobs = state.jobs.filter((j) => j.customerId === c.id).sort((a, b) => b.date.localeCompare(a.date));
        const stats = customerStats(state, c.id);
        return { c, vehicles, jobs, stats };
      }),
    [state],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { VIP: 0, New: 0, Returning: 0, "At-risk": 0 };
    for (const r of rows) c[r.stats.segment] = (c[r.stats.segment] ?? 0) + 1;
    return c;
  }, [rows]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const qd = digits(q);
    const plate = q.replace(/[^a-z0-9]/g, "");
    const filtered = rows.filter(({ c, vehicles, stats }) => {
      if (segment !== "all" && stats.segment !== segment) return false;
      if (!q) return true;
      const byName = c.name.toLowerCase().includes(q);
      const byPhone = qd.length >= 3 && digits(c.phone).includes(qd);
      const byPlate = plate.length >= 2 && vehicles.some((v) => v.plate.toLowerCase().includes(plate));
      if (mode === "name") return byName;
      if (mode === "phone") return byPhone;
      if (mode === "plate") return byPlate;
      return byName || byPhone || byPlate;
    });
    const copy = [...filtered];
    if (sort === "name") copy.sort((a, b) => a.c.name.localeCompare(b.c.name));
    else if (sort === "visits") copy.sort((a, b) => b.jobs.length - a.jobs.length);
    else if (sort === "value") copy.sort((a, b) => b.stats.lifetimeValue - a.stats.lifetimeValue);
    else copy.sort((a, b) => (b.jobs[0]?.date ?? "").localeCompare(a.jobs[0]?.date ?? ""));
    return copy;
  }, [rows, query, mode, segment, sort]);

  const totalValue = rows.reduce((s, r) => s + r.stats.lifetimeValue, 0);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Customer & vehicle history"
        title={
          <span>
            Customers
            <HelpTip title="Find anyone in seconds">
              Search name, phone or plate. VIP = 5+ visits or $2k+ approved. At-risk = gone 6+ months. Tap History for the full story.
            </HelpTip>
          </span>
        }
        subtitle={`${rows.length} customers · ${money(Math.round(totalValue))} lifetime approved value`}
        actions={
          <Link href="/jobs/new" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
            <Plus className="size-4" /> New Vehicle
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {(
          [
            { label: "VIP", value: counts.VIP ?? 0, icon: Crown, tone: "text-amber-600" },
            { label: "New", value: counts.New ?? 0, icon: UserPlus, tone: "text-blue-600" },
            { label: "Returning", value: counts.Returning ?? 0, icon: Sparkles, tone: "text-emerald-600" },
            { label: "At-risk", value: counts["At-risk"] ?? 0, icon: Phone, tone: "text-red-600" },
          ] as const
        ).map((s) => (
          <button key={s.label} type="button" onClick={() => setSegment(segment === s.label ? "all" : (s.label as Segment))} className={`rounded-2xl bg-white p-4 text-left shadow-sm ring-1 transition hover:-translate-y-0.5 ${segment === s.label ? "ring-2 ring-slate-950" : "ring-slate-200/80"}`}>
            <p className={`flex items-center gap-1.5 text-xs font-bold ${s.tone}`}><s.icon className="size-3.5" /> {s.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-950">{s.value}</p>
          </button>
        ))}
      </div>

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
            <button key={m} type="button" onClick={() => setMode(m)} className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${mode === m ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              {m === "plate" ? "License plate" : m}
            </button>
          ))}
          <button type="button" onClick={() => setSort(sort === "recent" ? "value" : sort === "value" ? "visits" : sort === "visits" ? "name" : "recent")} className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
            <ArrowUpDown className="size-3.5" /> Sort: {sort}
          </button>
          <span className="w-full text-xs text-slate-500 sm:w-auto">{results.length} of {rows.length} customers{segment !== "all" ? ` · ${segment}` : ""}</span>
        </div>
      </Card>

      {results.length === 0 ? (
        <EmptyState title="No matching customers" text="Check the spelling, clear the segment filter, or try a different phone number or plate." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {results.map(({ c, vehicles, jobs, stats }) => (
            <Card key={c.id} className="anim-fade-up flex flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start gap-3">
                <Avatar initials={initials(c.name)} tone={stats.segment === "VIP" ? "brand" : "dark"} size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/customers/${c.id}`} className="truncate text-lg font-bold text-slate-950 hover:text-blue-600">{c.name}</Link>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${stats.segment === "VIP" ? "bg-amber-100 text-amber-800" : stats.segment === "New" ? "bg-blue-100 text-blue-700" : stats.segment === "At-risk" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                      {stats.segment}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">{c.city} · since {c.since}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    <b className="text-slate-900">{money(Math.round(stats.lifetimeValue))}</b> lifetime
                    {stats.awaitingValue > 0 && <span className="text-amber-700"> · {money(Math.round(stats.awaitingValue))} awaiting</span>}
                    {stats.openRecs > 0 && <span className="text-red-600"> · {stats.openRecs} open recs</span>}
                  </p>
                </div>
              </div>
              <div className="mt-4 grid gap-1.5 text-sm text-slate-700">
                <span className="flex items-center gap-2"><Phone className="size-4 text-slate-400" />{c.phone}</span>
                {c.email && <span className="flex items-center gap-2 truncate"><Mail className="size-4 text-slate-400" />{c.email}</span>}
              </div>
              <div className="mt-4 space-y-2">
                {vehicles.map((v) => (
                  <Link key={v.id} href={`/customers/${c.id}#vehicle-${v.id}`} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100 transition hover:bg-blue-50/60">
                    <span className="truncate text-sm font-semibold text-slate-800">{vehicleLabel(v)}</span>
                    <PlateBadge plate={v.plate} />
                  </Link>
                ))}
              </div>
              <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                <span className="text-xs text-slate-500">{jobs.length} visit{jobs.length === 1 ? "" : "s"}{jobs[0] ? ` · last ${relDay(jobs[0].date, state.anchorDay)}` : ""}{stats.daysSince !== null && stats.daysSince > 180 ? " · win back?" : ""}</span>
                <div className="flex gap-2">
                  <a href={telHref(c.phone)} aria-label={`Call ${c.name}`} className="grid size-10 place-items-center rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"><Phone className="size-4" /></a>
                  <a href={smsHref(c.phone, `Hi ${firstName(c.name)}, this is ${state.settings.shopName}.`)} aria-label={`Text ${c.name}`} className="grid size-10 place-items-center rounded-xl bg-slate-950 text-white hover:bg-slate-800"><MessageSquare className="size-4" /></a>
                  <Link href={`/customers/${c.id}`} className="inline-flex h-10 items-center rounded-xl px-3 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50">History</Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
