"use client";

import { useState, type ReactNode } from "react";
import { Database, Download, MonitorSmartphone, RotateCcw, Save, ShieldCheck, Store, Users, Wrench } from "lucide-react";
import { Toast, useToast } from "@/components/toast";
import { Avatar, Card, PageHeader, inputCls, labelCls } from "@/components/ui";
import type { AlignmentPackage } from "@/lib/data";
import { addTeamMember, exportJSON, resetDemo, storageHealthy, updateSettings, useMe, useShop } from "@/lib/store";

function Section({ icon, title, text, children }: { icon: ReactNode; title: string; text: string; children: ReactNode }) {
  return (
    <Card className="anim-fade-up p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-950 text-white">{icon}</span>
        <div>
          <h2 className="font-bold text-slate-950">{title}</h2>
          <p className="text-sm text-slate-500">{text}</p>
        </div>
      </div>
      {children}
    </Card>
  );
}

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function SettingsPage() {
  const state = useShop();
  const me = useMe();
  const [toast, showToast] = useToast();
  const s = state.settings;

  const [shop, setShop] = useState({ shopName: s.shopName, phone: s.phone, address: s.address, hours: s.hours, website: s.website });
  const [tpl, setTpl] = useState({ reportTemplate: s.reportTemplate, estimateTemplate: s.estimateTemplate });
  const [std, setStd] = useState({ treadSoon: s.treadSoon, treadReplace: s.treadReplace, padSoon: s.padSoon, padReplace: s.padReplace, taxRate: s.taxRate });
  const [packages, setPackages] = useState<AlignmentPackage[]>(s.alignmentPackages.map((p) => ({ ...p })));
  const [member, setMember] = useState({ name: "", role: "Technician" });

  const csv = () => {
    const header = "Name,Phone,Email,City,Vehicles,Plates";
    const lines = state.customers.map((c) => {
      const vs = state.vehicles.filter((v) => v.customerId === c.id);
      const cells = [c.name, c.phone, c.email, c.city, vs.map((v) => `${v.year} ${v.make} ${v.model}`).join("; "), vs.map((v) => v.plate).join("; ")];
      return cells.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",");
    });
    return [header, ...lines].join("\n");
  };

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Shop setup" title="Settings" subtitle="Shop profile, text messages, inspection standards, team and data export." />

      <div className="grid gap-5 xl:grid-cols-2">
        <Section icon={<Store className="size-5" />} title="Shop profile" text="Shown on customer reports, inspection sheets and texts.">
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                ["shopName", "Shop name"],
                ["phone", "Phone"],
                ["address", "Address"],
                ["website", "Website"],
              ] as const
            ).map(([k, label]) => (
              <label key={k} className={k === "address" ? "sm:col-span-2" : ""}>
                <span className={labelCls}>{label}</span>
                <input value={shop[k]} onChange={(e) => setShop({ ...shop, [k]: e.target.value })} className={inputCls} />
              </label>
            ))}
            <label className="sm:col-span-2">
              <span className={labelCls}>Hours</span>
              <input value={shop.hours} onChange={(e) => setShop({ ...shop, hours: e.target.value })} className={inputCls} />
            </label>
          </div>
          <button type="button" onClick={() => { updateSettings(shop); showToast("Shop profile saved."); }} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
            <Save className="size-4" /> Save profile
          </button>
        </Section>

        <Section icon={<Wrench className="size-5" />} title="Inspection standards" text="Controls the automatic Good / Soon / Replace colours.">
          <div className="grid grid-cols-2 gap-4">
            <label>
              <span className={labelCls}>Tread &ldquo;Soon&rdquo; at or below (32nds)</span>
              <input type="number" min={1} max={12} value={std.treadSoon} onChange={(e) => setStd({ ...std, treadSoon: Number(e.target.value) })} className={inputCls} />
            </label>
            <label>
              <span className={labelCls}>Tread &ldquo;Replace&rdquo; at or below</span>
              <input type="number" min={1} max={12} value={std.treadReplace} onChange={(e) => setStd({ ...std, treadReplace: Number(e.target.value) })} className={inputCls} />
            </label>
            <label>
              <span className={labelCls}>Pads &ldquo;Soon&rdquo; at or below (mm)</span>
              <input type="number" min={1} max={12} value={std.padSoon} onChange={(e) => setStd({ ...std, padSoon: Number(e.target.value) })} className={inputCls} />
            </label>
            <label>
              <span className={labelCls}>Pads &ldquo;Replace&rdquo; at or below</span>
              <input type="number" min={1} max={12} value={std.padReplace} onChange={(e) => setStd({ ...std, padReplace: Number(e.target.value) })} className={inputCls} />
            </label>
            <label className="col-span-2">
              <span className={labelCls}>Sales tax on parts (%)</span>
              <input type="number" step="0.01" min={0} max={15} value={std.taxRate} onChange={(e) => setStd({ ...std, taxRate: Number(e.target.value) })} className={inputCls} />
            </label>
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-700">Alignment packages (ALG)</p>
          <div className="mt-2 grid gap-2">
            {packages.map((p, i) => (
              <div key={p.price} className="flex items-center gap-2">
                <span className="w-14 shrink-0 rounded-lg bg-slate-950 py-2 text-center text-sm font-black text-white">{p.price}</span>
                <input
                  value={p.label}
                  onChange={(e) => setPackages(packages.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                  aria-label={`ALG ${p.price} label`}
                  className={inputCls}
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              updateSettings({ ...std, treadReplace: Math.min(std.treadReplace, std.treadSoon), padReplace: Math.min(std.padReplace, std.padSoon), alignmentPackages: packages });
              showToast("Inspection standards saved.");
            }}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Save className="size-4" /> Save standards
          </button>
        </Section>

        <Section icon={<ShieldCheck className="size-5" />} title="Customer text messages" text="Use {first}, {vehicle}, {link} and {total} as placeholders.">
          <label className="block">
            <span className={labelCls}>Inspection report text</span>
            <textarea rows={3} value={tpl.reportTemplate} onChange={(e) => setTpl({ ...tpl, reportTemplate: e.target.value })} className={`${inputCls} h-auto py-2.5`} />
          </label>
          <label className="mt-4 block">
            <span className={labelCls}>Estimate text</span>
            <textarea rows={3} value={tpl.estimateTemplate} onChange={(e) => setTpl({ ...tpl, estimateTemplate: e.target.value })} className={`${inputCls} h-auto py-2.5`} />
          </label>
          <button type="button" onClick={() => { updateSettings(tpl); showToast("Text templates saved."); }} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
            <Save className="size-4" /> Save templates
          </button>
        </Section>

        <Section icon={<Users className="size-5" />} title="Team" text="Employees who can accept jobs and run inspections.">
          <ul className="divide-y divide-slate-100">
            {state.team.map((m) => (
              <li key={m.id} className="flex items-center gap-3 py-2.5">
                <Avatar initials={m.initials} tone={m.id === me.id ? "brand" : "dark"} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{m.name}{m.id === me.id ? " (you)" : ""}</p>
                  <p className="truncate text-xs text-slate-500">{m.role}</p>
                </div>
              </li>
            ))}
          </ul>
          <form
            className="mt-4 grid gap-2 sm:grid-cols-[1fr_160px_auto]"
            onSubmit={(e) => {
              e.preventDefault();
              if (!member.name.trim()) return;
              addTeamMember(member.name, member.role);
              showToast(`${member.name} added to the team.`);
              setMember({ name: "", role: "Technician" });
            }}
          >
            <input value={member.name} onChange={(e) => setMember({ ...member, name: e.target.value })} placeholder="Full name" aria-label="New team member name" className={inputCls} />
            <select value={member.role} onChange={(e) => setMember({ ...member, role: e.target.value })} aria-label="Role" className={inputCls}>
              <option>Technician</option>
              <option>Service Advisor</option>
              <option>Manager</option>
            </select>
            <button type="submit" className="h-11 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800">Add</button>
          </form>
        </Section>

        <Section icon={<Database className="size-5" />} title="Data ownership" text="Your data is yours. Export everything anytime, no lock-in.">
          <ul className="space-y-2 text-sm text-slate-700">
            <li>• Standard tech: Next.js, PostgreSQL and Drizzle ORM. Any developer can take it over.</li>
            <li>• You own the source code, the database and the domain.</li>
            <li>• One-click exports to JSON (everything) or CSV (customers).</li>
          </ul>
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" onClick={() => download(`castle-tire-export-${state.anchorDay}.json`, exportJSON(), "application/json")} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
              <Download className="size-4" /> Export all (JSON)
            </button>
            <button type="button" onClick={() => download(`castle-tire-customers-${state.anchorDay}.csv`, csv(), "text/csv")} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50">
              <Download className="size-4" /> Customers (CSV)
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Reset all demo data back to the starting point?")) {
                  resetDemo();
                  showToast("Demo data reset.");
                }
              }}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-50"
            >
              <RotateCcw className="size-4" /> Reset demo data
            </button>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Demo mode: data is kept in this browser{storageHealthy() ? "" : " (storage is full; newest photos may not persist)"}. Production uses your own PostgreSQL database and photo storage.
          </p>
        </Section>

        <Section icon={<MonitorSmartphone className="size-5" />} title="Install on every device" text="Works like an app on phones, tablets and PCs (PWA).">
          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
              <p className="font-semibold text-slate-900">iPhone / iPad</p>
              <p className="mt-1 text-slate-600">Open in Safari → Share → <b>Add to Home Screen</b>.</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
              <p className="font-semibold text-slate-900">Android</p>
              <p className="mt-1 text-slate-600">Open in Chrome → ⋮ menu → <b>Install app</b>.</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
              <p className="font-semibold text-slate-900">Windows PC</p>
              <p className="mt-1 text-slate-600">Edge or Chrome → install icon in the address bar.</p>
            </div>
          </div>
        </Section>
      </div>
      <Toast toast={toast} />
    </div>
  );
}
