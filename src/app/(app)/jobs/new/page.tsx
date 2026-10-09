"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { ArrowLeft, Car, Check, ClipboardList, Contact, Loader2, UserRound, X } from "lucide-react";
import { Card, PlateBadge, inputCls, labelCls } from "@/components/ui";
import { MAKES, MODELS, SERVICE_CHIPS, TIME_SLOTS, type Customer, type Vehicle } from "@/lib/data";
import { createWorkOrder, useMe, useShop } from "@/lib/store";
import { digits, formatPhone, timeSlotNow, vehicleLabel } from "@/lib/utils";

const YEARS = Array.from({ length: 38 }, (_, i) => 2027 - i);

type Form = {
  name: string;
  phone: string;
  email: string;
  year: string;
  make: string;
  model: string;
  plate: string;
  mileage: string;
  complaint: string;
  time: string;
  techId: string;
};

export default function NewVehiclePage() {
  // useSearchParams reflects the new URL during in-app navigation (window.location may still be the old one).
  const vehicleId = useSearchParams().get("vehicle") ?? "";
  return <NewVehicleForm key={vehicleId} vehicleId={vehicleId} />;
}

function NewVehicleForm({ vehicleId }: { vehicleId: string }) {
  const state = useShop();
  const me = useMe();
  const router = useRouter();

  const [linked, setLinked] = useState<{ customerId?: string; vehicleId?: string }>(() => {
    const v = vehicleId ? state.vehicles.find((x) => x.id === vehicleId) : undefined;
    return v ? { customerId: v.customerId, vehicleId: v.id } : {};
  });
  const [form, setForm] = useState<Form>(() => {
    const v = linked.vehicleId ? state.vehicles.find((x) => x.id === linked.vehicleId) : undefined;
    const c = v ? state.customers.find((x) => x.id === v.customerId) : undefined;
    return {
      name: c?.name ?? "",
      phone: c?.phone ?? "",
      email: c?.email ?? "",
      year: v ? String(v.year) : "",
      make: v?.make ?? "",
      model: v?.model ?? "",
      plate: v?.plate ?? "",
      mileage: v ? String(v.mileage) : "",
      complaint: "",
      time: "now",
      techId: "",
    };
  });
  const [lookupOpen, setLookupOpen] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const matches = useMemo(() => {
    const qd = digits(form.phone);
    const qn = form.name.trim().toLowerCase();
    if (linked.customerId) return [];
    if (qd.length < 3 && qn.length < 2 && !lookupOpen) return [];
    return state.customers
      .filter((c) => {
        if (lookupOpen && qd.length < 3 && qn.length < 2) return true;
        return (qd.length >= 3 && digits(c.phone).includes(qd)) || (qn.length >= 2 && c.name.toLowerCase().includes(qn));
      })
      .slice(0, 6);
  }, [form.phone, form.name, state.customers, linked.customerId, lookupOpen]);

  function pickCustomer(c: Customer) {
    setLinked({ customerId: c.id });
    setForm((f) => ({ ...f, name: c.name, phone: c.phone, email: c.email }));
    setLookupOpen(false);
  }

  function pickVehicle(v: Vehicle) {
    setLinked((l) => ({ ...l, vehicleId: v.id }));
    setForm((f) => ({ ...f, year: String(v.year), make: v.make, model: v.model, plate: v.plate, mileage: String(v.mileage) }));
  }

  function clearLink() {
    setLinked({});
    setForm((f) => ({ ...f, name: "", phone: "", email: "", year: "", make: "", model: "", plate: "", mileage: "" }));
  }

  function toggleChip(chip: string) {
    const parts = form.complaint
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    const has = parts.some((p) => p.toLowerCase() === chip.toLowerCase());
    const next = has ? parts.filter((p) => p.toLowerCase() !== chip.toLowerCase()) : [...parts, chip];
    set("complaint", next.join(", "));
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const errs: Partial<Record<keyof Form, string>> = {};
    if (!form.name.trim()) errs.name = "Enter the customer's name";
    if (digits(form.phone).length < 10) errs.phone = "Enter a 10-digit phone number";
    if (!form.year) errs.year = "Pick a year";
    if (!form.make) errs.make = "Pick a make";
    if (!form.model.trim()) errs.model = "Enter the model";
    if (!form.plate.trim()) errs.plate = "Enter the plate";
    if (!form.complaint.trim()) errs.complaint = "What does the customer need?";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    const id = createWorkOrder(
      {
        name: form.name,
        phone: form.phone,
        email: form.email,
        year: Number(form.year),
        make: form.make,
        model: form.model,
        plate: form.plate,
        mileage: Number(digits(form.mileage)) || 0,
        complaint: form.complaint,
        time: form.time === "now" ? timeSlotNow() : form.time,
        techId: form.techId || null,
        customerId: linked.customerId,
        vehicleId: linked.vehicleId,
      },
      me.id,
    );
    router.push(`/jobs/${id}?created=1`);
  }

  const linkedCustomer = linked.customerId ? state.customers.find((c) => c.id === linked.customerId) : undefined;
  const customerVehicles = linkedCustomer ? state.vehicles.filter((v) => v.customerId === linkedCustomer.id) : [];
  const err = (k: keyof Form) =>
    errors[k] ? <p className="mt-1 text-xs font-medium text-brand-600">{errors[k]}</p> : null;
  const invalid = (k: keyof Form) => (errors[k] ? "border-brand-400 ring-4 ring-brand-500/10" : "");

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link href="/jobs" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft className="size-4" /> Today&apos;s Jobs
      </Link>

      <div className="anim-fade-up">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Step 1 · Check-in</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">New Vehicle / Customer</h1>
        <p className="mt-1 text-sm text-slate-600">Takes about 30 seconds. Returning customers fill in automatically.</p>
      </div>

      <form onSubmit={submit} noValidate>
        <Card className="anim-fade-up space-y-5 p-5 sm:p-6">
          {/* Customer */}
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <UserRound className="size-4 text-brand-600" /> Customer
            {linkedCustomer && (
              <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
                <Check className="size-3.5" /> Returning customer
                <button type="button" onClick={clearLink} aria-label="Clear customer" className="ml-0.5 rounded-full p-0.5 hover:bg-emerald-100">
                  <X className="size-3" />
                </button>
              </span>
            )}
          </div>

          <div>
            <label htmlFor="name" className={labelCls}>Customer Name</label>
            <input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="John Smith" autoComplete="name" className={`${inputCls} ${invalid("name")}`} />
            {err("name")}
          </div>

          <div className="relative">
            <label htmlFor="phone" className={labelCls}>Phone Number</label>
            <div className="flex gap-2">
              <input
                id="phone"
                type="tel"
                inputMode="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                onBlur={() => set("phone", formatPhone(form.phone))}
                placeholder="857-555-1234"
                autoComplete="tel"
                className={`${inputCls} ${invalid("phone")}`}
              />
              <button
                type="button"
                onClick={() => setLookupOpen((o) => !o)}
                aria-label="Look up existing customer"
                className={`grid size-11 shrink-0 place-items-center rounded-xl ring-1 transition ${lookupOpen ? "bg-blue-600 text-white ring-blue-600" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"}`}
              >
                <Contact className="size-5" />
              </button>
            </div>
            {err("phone")}
            {matches.length > 0 && (
              <div className="anim-fade-up absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-slate-200">
                <p className="border-b border-slate-100 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Existing customers</p>
                <ul className="max-h-64 overflow-y-auto">
                  {matches.map((c) => {
                    const vs = state.vehicles.filter((v) => v.customerId === c.id);
                    return (
                      <li key={c.id}>
                        <button type="button" onClick={() => pickCustomer(c)} className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-blue-50">
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-slate-900">{c.name}</span>
                            <span className="block truncate text-xs text-slate-500">{c.phone} · {vs.map((v) => `${v.make} ${v.model}`).join(", ")}</span>
                          </span>
                          <span className="shrink-0 text-xs font-semibold text-blue-600">Use</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="email" className={labelCls}>Email <span className="font-normal text-slate-400">(optional)</span></label>
            <input id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="name@email.com" autoComplete="email" className={inputCls} />
          </div>

          {/* Vehicle */}
          <div className="flex items-center gap-2 border-t border-slate-100 pt-5 text-sm font-bold text-slate-900">
            <Car className="size-4 text-brand-600" /> Vehicle
          </div>

          {customerVehicles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {customerVehicles.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => pickVehicle(v)}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ring-1 transition ${
                    linked.vehicleId === v.id ? "bg-blue-50 text-blue-800 ring-blue-500" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {vehicleLabel(v)} <PlateBadge plate={v.plate} />
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="year" className={labelCls}>Year</label>
              <select id="year" value={form.year} onChange={(e) => set("year", e.target.value)} className={`${inputCls} px-2.5 ${invalid("year")}`}>
                <option value="">Year</option>
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              {err("year")}
            </div>
            <div>
              <label htmlFor="make" className={labelCls}>Make</label>
              <select id="make" value={form.make} onChange={(e) => set("make", e.target.value)} className={`${inputCls} px-2.5 ${invalid("make")}`}>
                <option value="">Make</option>
                {MAKES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              {err("make")}
            </div>
            <div>
              <label htmlFor="model" className={labelCls}>Model</label>
              <input id="model" list="model-list" value={form.model} onChange={(e) => set("model", e.target.value)} placeholder="RAV4" className={`${inputCls} ${invalid("model")}`} />
              <datalist id="model-list">
                {(MODELS[form.make] ?? []).map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
              {err("model")}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="plate" className={labelCls}>Plate Number</label>
              <input
                id="plate"
                value={form.plate}
                onChange={(e) => set("plate", e.target.value.toUpperCase())}
                placeholder="3ABC27"
                autoCapitalize="characters"
                className={`${inputCls} font-mono uppercase tracking-wider ${invalid("plate")}`}
              />
              {err("plate")}
            </div>
            <div>
              <label htmlFor="mileage" className={labelCls}>Mileage</label>
              <input
                id="mileage"
                inputMode="numeric"
                value={form.mileage}
                onChange={(e) => {
                  const d = digits(e.target.value);
                  set("mileage", d ? Number(d).toLocaleString("en-US") : "");
                }}
                placeholder="68,450"
                className={inputCls}
              />
            </div>
          </div>

          {/* Service */}
          <div className="flex items-center gap-2 border-t border-slate-100 pt-5 text-sm font-bold text-slate-900">
            <ClipboardList className="size-4 text-brand-600" /> Requested Service / Complaint
          </div>
          <div>
            <textarea
              value={form.complaint}
              onChange={(e) => set("complaint", e.target.value)}
              rows={3}
              placeholder="Tire repair, check brakes"
              aria-label="Requested service or complaint"
              className={`${inputCls} h-auto py-3 ${invalid("complaint")}`}
            />
            {err("complaint")}
            <div className="mt-2.5 flex flex-wrap gap-2">
              {SERVICE_CHIPS.map((chip) => {
                const on = form.complaint.toLowerCase().includes(chip.toLowerCase());
                return (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => toggleChip(chip)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${on ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                  >
                    {on ? "✓ " : "+ "}
                    {chip}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="time" className={labelCls}>Appointment</label>
              <select id="time" value={form.time} onChange={(e) => set("time", e.target.value)} className={`${inputCls} px-2.5`}>
                <option value="now">Now (walk-in)</option>
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="tech" className={labelCls}>Technician</label>
              <select id="tech" value={form.techId} onChange={(e) => set("techId", e.target.value)} className={`${inputCls} px-2.5`}>
                <option value="">Any tech (accept later)</option>
                {state.team.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 text-base font-bold text-white shadow-lg shadow-brand-600/30 transition hover:bg-brand-700 active:scale-[0.99] disabled:opacity-70"
          >
            {saving ? <Loader2 className="size-5 animate-spin" /> : null}
            Create Work Order
          </button>
        </Card>
      </form>
    </div>
  );
}
