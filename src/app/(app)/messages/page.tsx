"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronLeft, MessageSquare, Phone, Search, Send } from "lucide-react";
import { CastleLogo } from "@/components/brand";
import { Avatar, Card, EmptyState, PageHeader } from "@/components/ui";
import type { Message } from "@/lib/data";
import { sendMessage, useMe, useShop } from "@/lib/store";
import { byId, firstName, fmtDate, fmtTime, initials, relDay, relStamp, smsHref, telHref, vehicleLabel } from "@/lib/utils";

const QUICK = [
  "Your vehicle is ready for pickup.",
  "We found something during the inspection. Please call us when you can.",
  "Your parts arrived. We'll have you back on the road today.",
  "Thanks for choosing Castle Tire Shop!",
];

export default function MessagesPage() {
  const initialCustomer = useSearchParams().get("c");
  return <MessagesView key={initialCustomer ?? ""} initialCustomer={initialCustomer} />;
}

function MessagesView({ initialCustomer }: { initialCustomer: string | null }) {
  const state = useShop();
  const me = useMe();
  const [selected, setSelected] = useState<string | null>(initialCustomer);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const origin = typeof window === "undefined" ? "" : window.location.origin;

  const convos = useMemo(() => {
    const map = new Map<string, Message[]>();
    for (const m of state.messages) map.set(m.customerId, [...(map.get(m.customerId) ?? []), m]);
    return [...map.entries()]
      .map(([customerId, msgs]) => ({
        customer: byId(state.customers, customerId),
        msgs: msgs.sort((a, b) => a.at.localeCompare(b.at)),
      }))
      .filter((c) => c.customer && (!query || c.customer.name.toLowerCase().includes(query.toLowerCase())))
      .sort((a, b) => b.msgs[b.msgs.length - 1].at.localeCompare(a.msgs[a.msgs.length - 1].at));
  }, [state, query]);

  const active = selected ? byId(state.customers, selected) : undefined;
  const thread = active ? state.messages.filter((m) => m.customerId === active.id).sort((a, b) => a.at.localeCompare(b.at)) : [];
  const others = state.customers.filter((c) => !convos.some((x) => x.customer?.id === c.id));

  function send() {
    if (!active || !draft.trim()) return;
    sendMessage(active.id, draft.trim(), me.id);
    setDraft("");
  }

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Customer texts" title="Messages" subtitle="Every report, estimate and text sent to customers, in one place." />

      <Card className="anim-fade-up grid h-[calc(100dvh-15rem)] min-h-[520px] overflow-hidden md:grid-cols-[320px_1fr]">
        {/* Conversation list */}
        <div className={`flex min-h-0 flex-col border-r border-slate-100 ${active ? "hidden md:flex" : "flex"}`}>
          <div className="space-y-2 border-b border-slate-100 p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search conversations"
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
            <select
              value=""
              onChange={(e) => e.target.value && setSelected(e.target.value)}
              aria-label="Start a new text"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600"
            >
              <option value="">+ New text to…</option>
              {others.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <ul className="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto">
            {convos.map(({ customer, msgs }) => {
              if (!customer) return null;
              const last = msgs[msgs.length - 1];
              const isActive = customer.id === active?.id;
              return (
                <li key={customer.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(customer.id)}
                    className={`flex w-full items-start gap-3 px-3 py-3 text-left transition ${isActive ? "bg-blue-50" : "hover:bg-slate-50"}`}
                  >
                    <Avatar initials={initials(customer.name)} tone={last.direction === "in" ? "brand" : "light"} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-slate-900">{customer.name}</p>
                        <span className="shrink-0 text-[11px] text-slate-400">{relDay(last.at, state.anchorDay) === "Today" ? fmtTime(last.at) : relDay(last.at, state.anchorDay)}</span>
                      </div>
                      <p className="line-clamp-1 text-xs text-slate-500">
                        {last.direction === "out" ? "You: " : ""}
                        {last.body}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Thread */}
        <div className={`min-h-0 flex-col ${active ? "flex" : "hidden md:flex"}`}>
          {!active ? (
            <div className="grid flex-1 place-items-center p-6">
              <EmptyState title="Pick a conversation" text="Report and estimate links you send show up here automatically." />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-slate-100 px-3 py-2.5">
                <button type="button" onClick={() => setSelected(null)} aria-label="Back" className="grid size-9 place-items-center rounded-full hover:bg-slate-100 md:hidden">
                  <ChevronLeft className="size-5" />
                </button>
                <Avatar initials={initials(active.name)} tone="dark" />
                <div className="min-w-0 flex-1">
                  <Link href={`/customers/${active.id}`} className="block truncate font-semibold text-slate-900 hover:text-blue-600">{active.name}</Link>
                  <p className="truncate text-xs text-slate-500">
                    {active.phone} · {state.vehicles.filter((v) => v.customerId === active.id).map((v) => vehicleLabel(v)).join(", ")}
                  </p>
                </div>
                <a href={telHref(active.phone)} aria-label="Call" className="grid size-9 place-items-center rounded-full bg-emerald-600 text-white">
                  <Phone className="size-4" />
                </a>
              </div>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50 px-3 py-4 sm:px-5">
                {thread.length === 0 && <p className="text-center text-sm text-slate-500">No messages yet. Say hello 👋</p>}
                {thread.map((m, i) => {
                  const showDay = i === 0 || thread[i - 1].at.slice(0, 10) !== m.at.slice(0, 10);
                  const out = m.direction === "out";
                  const full = m.link && !m.body.includes("/r/") ? `${m.body} ${origin}${m.link}` : m.body;
                  return (
                    <div key={m.id}>
                      {showDay && (
                        <p className="my-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          {relDay(m.at, state.anchorDay) === "Today" ? "Today" : fmtDate(m.at, { weekday: "short", month: "short", day: "numeric" })}
                        </p>
                      )}
                      <div className={`flex ${out ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] sm:max-w-[70%]`}>
                          <div className={`rounded-2xl px-3.5 py-2 text-sm leading-snug shadow-sm ${out ? "rounded-br-md bg-blue-600 text-white" : "rounded-bl-md bg-white text-slate-900 ring-1 ring-slate-200"}`}>
                            <p className="whitespace-pre-wrap break-words">{full}</p>
                          </div>
                          {m.link && (
                            <Link href={m.link} target="_blank" className="mt-1.5 block overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:shadow-md">
                              <div className="flex items-center gap-3 p-3">
                                <CastleLogo className="h-8 w-auto shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-[11px] font-black tracking-tight text-slate-950">
                                    {m.kind === "estimate" ? "REPAIR ESTIMATE" : "VEHICLE INSPECTION REPORT"}
                                  </p>
                                  <p className="truncate text-[11px] text-slate-500">{origin.replace(/^https?:\/\//, "")}{m.link}</p>
                                </div>
                              </div>
                            </Link>
                          )}
                          <p className={`mt-1 text-[10px] text-slate-400 ${out ? "text-right" : ""}`}>
                            {out ? `${byId(state.team, m.by)?.name.split(" ")[0] ?? "Shop"} · ` : ""}
                            {relStamp(m.at, state.anchorDay)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2 border-t border-slate-100 p-3">
                <div className="no-scrollbar flex gap-2 overflow-x-auto">
                  {QUICK.map((q) => (
                    <button key={q} type="button" onClick={() => setDraft(q)} className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200">
                      {q}
                    </button>
                  ))}
                </div>
                <div className="flex items-end gap-2">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={1}
                    placeholder={`Text ${firstName(active.name)}…`}
                    aria-label="Message"
                    className="max-h-32 min-h-11 flex-1 resize-y rounded-2xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
                  />
                  <a
                    href={draft.trim() ? smsHref(active.phone, draft.trim()) : undefined}
                    onClick={(e) => {
                      if (!draft.trim()) {
                        e.preventDefault();
                        return;
                      }
                      send();
                    }}
                    aria-label="Send text"
                    className={`grid size-11 shrink-0 place-items-center rounded-full text-white transition ${draft.trim() ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-300"}`}
                  >
                    <Send className="size-4" />
                  </a>
                </div>
                <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <MessageSquare className="size-3" /> Opens your phone&apos;s Messages app and logs the text here. Two-way texting can be added with Twilio.
                </p>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
