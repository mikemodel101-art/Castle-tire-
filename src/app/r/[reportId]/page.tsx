import type * as React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, Gauge, MapPin, Phone, MessageSquare, Clock, Play, Wrench } from "lucide-react";
import { CATEGORIES, PHOTOS, SHOP, STAGES, type CheckStatus, type Status } from "@/lib/data";
import {
  customerForJob,
  findMember,
  findReport,
  findJob,
  fmtNum,
  fmtTread,
  formatDate,
  inspectionForJob,
  mediaOfJob,
  money,
  padStatus,
  rangeStatus,
  rotorStatus,
  sectionStatuses,
  smsLink,
  statusMeta,
  telLink,
  tireStatus,
  tpmsStatus,
  vehicleForJob,
  vehicleLabel,
} from "@/lib/utils";

export const metadata: Metadata = {
  title: "Your inspection report · Castle Tire Shop",
  robots: { index: false, follow: false },
};

const OVERALL_TEXT: Record<CheckStatus, { title: string; text: string }> = {
  green: { title: "Vehicle passes inspection", text: "Everything checked is within safe specification." },
  yellow: { title: "Monitor & plan repairs", text: "A few items are wearing. Plan the repairs soon." },
  red: { title: "Repairs recommended", text: "Some items are unsafe or out of spec. We recommend repairs now." },
  pending: { title: "Inspection in progress", text: "Your technician is still completing this inspection." },
};

export default async function PublicReportPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  const report = findReport(reportId);
  if (!report) notFound();

  const job = findJob(report.jobId);
  if (!job) notFound();

  const customer = customerForJob(job);
  const vehicle = vehicleForJob(job);
  const tech = findMember(job.assignedTo);
  const ins = inspectionForJob(job);
  const s = sectionStatuses(ins);
  const media = mediaOfJob(job.id);
  const total = ins.recommendations.reduce((sum, r) => sum + (Number(r.estimate) || 0), 0);
  const overall = OVERALL_TEXT[s.overall];
  const overallMeta = statusMeta(s.overall);
  const firstName = customer?.name.split(" ")[0] ?? "there";

  const tileStatuses: { label: string; status: CheckStatus }[] = [
    { label: "Tires & tread", status: s.tires },
    { label: "Brakes", status: s.brakes },
    { label: "Tire pressure", status: s.tpms },
    { label: "Suspension", status: s.suspension },
    { label: "Alignment", status: s.alignment },
  ];

  return (
    <div className="min-h-dvh bg-slate-100 text-slate-900">
      {/* Brand header */}
      <header className="bg-slate-950 text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-5">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-amber-300 to-orange-500">
              <svg viewBox="0 0 48 48" className="size-6 text-slate-900" fill="none" aria-hidden="true">
                <circle cx="24" cy="24" r="17" stroke="currentColor" strokeWidth="5" />
                <circle cx="24" cy="24" r="6" fill="currentColor" />
                <path d="M24 7v9M24 32v9M7 24h9M32 24h9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </span>
            <div>
              <p className="text-lg font-bold leading-tight">{SHOP.name}</p>
              <p className="text-xs text-amber-300">{SHOP.tagline}</p>
            </div>
          </div>
          <div className="hidden text-right text-xs text-slate-400 sm:block">
            <p>Report {report.id}</p>
            <p>{formatDate(job.date)}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-5 sm:py-8">
        {/* Hero */}
        <section className="anim-fade-up relative overflow-hidden rounded-3xl bg-slate-950 text-white shadow-xl">
          <img src={media.find((m) => m.type === "photo")?.url ?? PHOTOS.carOnLift} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/40" />
          <div className="relative grid gap-6 p-6 sm:p-9 md:grid-cols-[1.3fr_1fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">Digital inspection report</p>
              <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">{vehicle ? vehicleLabel(vehicle) : "Your vehicle"}</h1>
              <p className="mt-2 text-slate-300">Prepared for {customer?.name}</p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-200">
                <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5"><CalendarDays className="size-3.5" /> {formatDate(job.date)} · {job.time}</span>
                <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5"><Gauge className="size-3.5" /> {vehicle?.mileage.toLocaleString("en-US")} mi</span>
                <span className="rounded-full bg-white/10 px-3 py-1.5 font-mono tracking-wider text-amber-300">{vehicle?.plate}</span>
                {tech && <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5"><Wrench className="size-3.5" /> {tech.name}</span>}
              </div>
            </div>
            <div className="flex flex-col justify-center rounded-2xl bg-white/5 p-5 ring-1 ring-white/10 backdrop-blur">
              <div className="flex items-center gap-3">
                <span className={`grid size-12 place-items-center rounded-full ${overallMeta.solid} shadow-lg`}>
                  <span className="size-4 rounded-full bg-current opacity-90" />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Overall</p>
                  <p className="text-lg font-bold">{overall.title}</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-300">{overall.text}</p>
              {total > 0 && (
                <p className="mt-4 border-t border-white/10 pt-3 text-sm text-slate-300">
                  Estimated total for recommended work: <span className="font-semibold text-white">{money(total)}</span>
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Status tiles */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {tileStatuses.map((t, i) => {
            const m = statusMeta(t.status);
            return (
              <div key={t.label} className="anim-fade-up rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200" style={{ animationDelay: `${0.1 + i * 0.06}s` }}>
                <span className={`block h-1.5 w-10 rounded-full ${m.bar}`} />
                <p className="mt-3 text-sm font-semibold">{t.label}</p>
                <p className="text-xs text-slate-500">{m.label}</p>
              </div>
            );
          })}
        </section>

        {/* Measurements */}
        <Panel title="Tires & tread depth" subtitle="Tread in 32nds of an inch. 6+ is good, under 4 needs replacing." status={s.tires}>
          <Table headers={["Position", "Tire", "Tread", "PSI", "Status"]}>
            {ins.tires.map((t) => (
              <tr key={t.position}>
                <Td strong>{t.position}</Td>
                <Td>{t.brand || "—"} <span className="text-slate-400">{t.size}</span></Td>
                <Td>{fmtTread(t.treadDepth)}</Td>
                <Td>{t.psi ?? "—"}</Td>
                <Td><Badge status={tireStatus(t.treadDepth)} /></Td>
              </tr>
            ))}
          </Table>
        </Panel>

        <Panel title="Brakes" subtitle="Pad thickness and rotor condition versus minimum specification." status={s.brakes}>
          <Table headers={["Position", "Pads", "Rotor (min)", "Status"]}>
            {ins.brakes.map((b) => {
              const st = [padStatus(b.padMm), rotorStatus(b.rotorMm, b.rotorMinMm)];
              const row: CheckStatus = st.includes("red") ? "red" : st.includes("yellow") ? "yellow" : st[0];
              return (
                <tr key={b.position}>
                  <Td strong>{b.position}</Td>
                  <Td>{fmtNum(b.padMm)} mm</Td>
                  <Td>{fmtNum(b.rotorMm)} mm <span className="text-slate-400">({b.rotorMinMm})</span></Td>
                  <Td><Badge status={row} /></Td>
                </tr>
              );
            })}
          </Table>
        </Panel>

        <Panel title="Tire pressure (TPMS)" subtitle="Target 35 PSI. Sensors checked on every corner." status={s.tpms}>
          <Table headers={["Position", "PSI", "Sensor", "Status"]}>
            {ins.tpms.map((t) => (
              <tr key={t.position}>
                <Td strong>{t.position}</Td>
                <Td>{t.psi ?? "—"}</Td>
                <Td>{t.sensorOk ? "Working" : "Fault"}</Td>
                <Td><Badge status={tpmsStatus(t.psi, t.sensorOk)} /></Td>
              </tr>
            ))}
          </Table>
        </Panel>

        <Panel title="Suspension & steering" subtitle="Each component was checked by hand and on the lift." status={s.suspension}>
          <Table headers={["Component", "Notes", "Status"]}>
            {ins.suspension.map((c) => (
              <tr key={c.item}>
                <Td strong>{c.item}</Td>
                <Td>{c.note || <span className="text-slate-400">—</span>}</Td>
                <Td><Badge status={c.status} /></Td>
              </tr>
            ))}
          </Table>
        </Panel>

        <Panel title="Wheel alignment" subtitle="Measured in degrees against specification." status={s.alignment}>
          <Table headers={["Measure", "Reading", "Spec", "Status"]}>
            {(["caster", "camber", "toe"] as const).map((k) => {
              const m = ins.alignment[k];
              return (
                <tr key={k}>
                  <Td strong><span className="capitalize">{k}</span></Td>
                  <Td>{fmtNum(m.value, 2)}°</Td>
                  <Td>{m.min}° to {m.max}°</Td>
                  <Td><Badge status={rangeStatus(m.value, m.min, m.max)} /></Td>
                </tr>
              );
            })}
          </Table>
        </Panel>

        {/* Notes */}
        {ins.notes && (
          <section className="anim-fade-up rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-semibold">Technician notes</h2>
            <p className="mt-2 leading-relaxed text-slate-700">{ins.notes}</p>
            {tech && <p className="mt-3 text-sm text-slate-500">— {tech.name}, {tech.role}</p>}
          </section>
        )}

        {/* Recommendations */}
        <section className="anim-fade-up rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Recommended repairs</h2>
              <p className="text-sm text-slate-500">Prioritized by safety. Call or text us to approve any work.</p>
            </div>
            {total > 0 && <p className="text-right"><span className="block text-xs text-slate-500">Total</span><span className="text-xl font-bold">{money(total)}</span></p>}
          </div>
          {ins.recommendations.length === 0 ? (
            <p className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">No repairs needed today. Keep up the good work with regular rotations.</p>
          ) : (
            <ul className="mt-5 space-y-3">
              {ins.recommendations.map((r) => {
                const m = statusMeta(r.severity as Status);
                const label = r.severity === "red" ? "Repair now" : r.severity === "yellow" ? "Monitor / soon" : "Optional";
                return (
                  <li key={r.id} className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
                    <span className={`mt-1 size-3 shrink-0 rounded-full ${m.dot}`} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900">{r.text}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{label} · {CATEGORIES.find((c) => c.id === r.category)?.label}</p>
                    </div>
                    <p className="shrink-0 font-semibold text-slate-900">{r.estimate ? money(r.estimate) : "—"}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Media */}
        {media.length > 0 && (
          <section className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold">Photos & videos from your inspection</h2>
              <p className="text-sm text-slate-500">Tap any photo or video to see it full size.</p>
            </div>
            {CATEGORIES.map((c) => {
              const list = media.filter((m) => m.category === c.id);
              if (list.length === 0) return null;
              return (
                <div key={c.id} className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{c.label}</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {list.map((m) => (
                      <figure key={m.id} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                        {m.type === "video" ? (
                          <video src={m.url} poster={m.poster} controls playsInline preload="none" className="aspect-video w-full bg-black" />
                        ) : (
                          <img src={m.url} alt={m.title} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                        )}
                        <figcaption className="flex items-center justify-between gap-2 px-4 py-3 text-sm">
                          <span className="font-medium capitalize">{m.title}</span>
                          <span className="flex shrink-0 items-center gap-1 text-xs text-slate-500">
                            {m.type === "video" ? <><Play className="size-3" /> Video</> : "Photo"}
                          </span>
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* Contact */}
        <section className="anim-fade-up overflow-hidden rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 p-6 text-slate-950 shadow-lg sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Questions? We&apos;re here, {firstName}.</h2>
              <p className="mt-1 flex items-center gap-2 text-sm"><MapPin className="size-4" /> {SHOP.address}</p>
              <p className="mt-1 flex items-center gap-2 text-sm"><Clock className="size-4" /> {SHOP.hours}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={telLink(SHOP.phone)} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                <Phone className="size-4" /> Call {SHOP.phone}
              </a>
              <a href={smsLink(SHOP.phone, `Hi Castle Tire, question about report ${report.id}`)} className="inline-flex items-center gap-2 rounded-xl bg-white/90 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white">
                <MessageSquare className="size-4" /> Text us
              </a>
            </div>
          </div>
        </section>

        <p className="pb-6 text-center text-xs text-slate-500">
          {SHOP.name} · Massachusetts · Report {report.id} · Stage: {STAGES[job.stage]}
        </p>
      </main>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  status,
  children,
}: {
  title: string;
  subtitle: string;
  status: CheckStatus;
  children: React.ReactNode;
}) {
  const m = statusMeta(status);
  return (
    <section className="anim-fade-up rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${m.badge}`}>{m.label}</span>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}

function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <table className="w-full min-w-[480px] text-left text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
          {headers.map((h) => (
            <th key={h} className="px-3 py-2 font-semibold">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">{children}</tbody>
    </table>
  );
}

function Td({ children, strong = false }: { children: React.ReactNode; strong?: boolean }) {
  return <td className={`px-3 py-3 align-middle ${strong ? "font-semibold text-slate-900" : "text-slate-700"}`}>{children}</td>;
}

function Badge({ status }: { status: CheckStatus }) {
  const m = statusMeta(status);
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${m.badge}`}>
      <span className={`size-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}
