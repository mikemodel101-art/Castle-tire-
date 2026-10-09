"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState, type ChangeEvent } from "react";
import { Camera, CheckCircle2, Image as ImageIcon, Loader2, Play, Trash2, Upload, Video, X } from "lucide-react";
import { compressImage } from "@/components/photo-capture";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { CORNERS, MEDIA_SECTIONS, MEDIA_SECTION_LABEL, type Media, type MediaSection } from "@/lib/data";
import { addMedia, removeMedia, updateMedia, useMe, useShop } from "@/lib/store";
import { byId, nowISO, relStamp, vehicleLabel } from "@/lib/utils";

type TypeFilter = "all" | "photo" | "video";

const ITEMS: Partial<Record<MediaSection, string[]>> = { tires: [...CORNERS], brakes: ["front", "rear"] };

export default function MediaPage() {
  const params = useSearchParams();
  return <MediaLibrary key={params.toString()} initialJob={params.get("job")} initialSection={params.get("section")} />;
}

function MediaLibrary({ initialJob, initialSection }: { initialJob: string | null; initialSection: string | null }) {
  const state = useShop();
  const me = useMe();
  const [section, setSection] = useState<MediaSection | "all">(
    MEDIA_SECTIONS.includes(initialSection as MediaSection) ? (initialSection as MediaSection) : "all",
  );
  const [jobFilter, setJobFilter] = useState<string>(initialJob ?? "all");
  const [type, setType] = useState<TypeFilter>("all");
  const [open, setOpen] = useState<Media | null>(null);
  const [upJob, setUpJob] = useState<string>(initialJob ?? state.jobs.find((j) => j.date === state.anchorDay)?.id ?? state.jobs[0]?.id ?? "");
  const [upSection, setUpSection] = useState<MediaSection>(section === "all" ? "tires" : section);
  const [upItem, setUpItem] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const jobLabel = (jobId: string) => {
    const j = byId(state.jobs, jobId);
    const v = j ? byId(state.vehicles, j.vehicleId) : undefined;
    return `${jobId}${v ? ` · ${vehicleLabel(v)}` : ""}`;
  };

  const filtered = useMemo(
    () =>
      state.media.filter(
        (m) => (section === "all" || m.section === section) && (jobFilter === "all" || m.jobId === jobFilter) && (type === "all" || m.type === type),
      ),
    [state.media, section, jobFilter, type],
  );

  const counts = useMemo(() => {
    const base = state.media.filter((m) => jobFilter === "all" || m.jobId === jobFilter);
    return Object.fromEntries(MEDIA_SECTIONS.map((s) => [s, base.filter((m) => m.section === s).length])) as Record<MediaSection, number>;
  }, [state.media, jobFilter]);

  async function onFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    const job = byId(state.jobs, upJob);
    if (!files.length || !job) return;
    setBusy(true);
    for (const file of files) {
      const isVideo = file.type.startsWith("video");
      let url = URL.createObjectURL(file);
      if (!isVideo) {
        try {
          const data = await compressImage(file);
          URL.revokeObjectURL(url);
          url = data;
        } catch {
          // keep the session URL
        }
      }
      addMedia({
        jobId: job.id,
        vehicleId: job.vehicleId,
        section: upSection,
        item: upItem || undefined,
        type: isVideo ? "video" : "photo",
        url,
        caption: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
        takenAt: nowISO(),
        by: me.id,
      });
    }
    setBusy(false);
    setMessage(`${files.length} file${files.length > 1 ? "s" : ""} saved to ${job.id} · ${MEDIA_SECTION_LABEL[upSection]}${upItem ? ` (${upItem.toUpperCase()})` : ""}.`);
    setSection(upSection);
    setJobFilter(job.id);
  }

  const groups = MEDIA_SECTIONS.map((s) => ({ s, list: filtered.filter((m) => m.section === s) })).filter((g) => g.list.length > 0);
  const selectCls = "mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm font-normal normal-case tracking-normal outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15";

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Photos & videos" title="Vehicle media library" subtitle="Everything is saved to the vehicle's history and sorted by inspection category." />

      <Card className="anim-fade-up overflow-hidden">
        <div className="grid md:grid-cols-[1fr_1.4fr]">
          <div className="bg-gradient-to-br from-slate-950 to-slate-800 p-6 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-400">Phone-ready upload</p>
            <h2 className="mt-2 text-xl font-bold">Snap it, tag it, done.</h2>
            <p className="mt-2 text-sm text-slate-300">On a phone this opens the camera. Pick the job and category and it&apos;s filed with the vehicle and shown on the customer report.</p>
          </div>
          <div className="space-y-4 p-5 sm:p-6">
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Job
                <select value={upJob} onChange={(e) => setUpJob(e.target.value)} className={selectCls}>
                  {state.jobs.map((j) => (
                    <option key={j.id} value={j.id}>{jobLabel(j.id)}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Category
                <select
                  value={upSection}
                  onChange={(e) => {
                    setUpSection(e.target.value as MediaSection);
                    setUpItem("");
                  }}
                  className={selectCls}
                >
                  {MEDIA_SECTIONS.map((s) => (
                    <option key={s} value={s}>{MEDIA_SECTION_LABEL[s]}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Position
                <select value={upItem} onChange={(e) => setUpItem(e.target.value)} disabled={!ITEMS[upSection]} className={`${selectCls} disabled:bg-slate-50 disabled:text-slate-400`}>
                  <option value="">{ITEMS[upSection] ? "Any" : "n/a"}</option>
                  {(ITEMS[upSection] ?? []).map((it) => (
                    <option key={it} value={it}>{it.toUpperCase()}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50/50 px-4 py-7 text-center transition hover:border-blue-500 hover:bg-blue-50">
              <span className="grid size-12 place-items-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 transition group-hover:scale-110">
                {busy ? <Loader2 className="size-5 animate-spin" /> : <Upload className="size-5" />}
              </span>
              <span className="font-semibold text-slate-900">Tap to take a photo or choose a video</span>
              <span className="text-xs text-slate-500">JPG, PNG, HEIC, MP4, MOV · iPhone, Android, tablet or PC</span>
              <input type="file" accept="image/*,video/*" capture="environment" multiple className="sr-only" onChange={onFiles} />
            </label>
            {message && (
              <p className="anim-fade-up flex items-center gap-2 text-sm text-emerald-700">
                <CheckCircle2 className="size-4" /> {message}
              </p>
            )}
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <Chip active={section === "all"} onClick={() => setSection("all")} label="All" count={Object.values(counts).reduce((a, b) => a + b, 0)} />
          {MEDIA_SECTIONS.map((s) => (
            <Chip key={s} active={section === s} onClick={() => setSection(s)} label={MEDIA_SECTION_LABEL[s]} count={counts[s]} />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={jobFilter} onChange={(e) => setJobFilter(e.target.value)} aria-label="Filter by job" className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500">
            <option value="all">All jobs &amp; vehicles</option>
            {state.jobs.map((j) => (
              <option key={j.id} value={j.id}>{jobLabel(j.id)}</option>
            ))}
          </select>
          <div className="flex rounded-xl bg-white p-1 ring-1 ring-slate-200">
            {(["all", "photo", "video"] as TypeFilter[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition ${type === t ? "bg-slate-950 text-white" : "text-slate-600"}`}
              >
                {t === "photo" && <ImageIcon className="size-3.5" />}
                {t === "video" && <Video className="size-3.5" />}
                {t === "all" ? "All" : t === "photo" ? "Photos" : "Videos"}
              </button>
            ))}
          </div>
          <span className="ml-auto text-xs text-slate-500">{filtered.length} items</span>
        </div>
      </div>

      {groups.length === 0 ? (
        <EmptyState title="No media for these filters" text="Try another category or upload a photo." />
      ) : (
        <div className="space-y-7">
          {groups.map((g) => (
            <section key={g.s} className="anim-fade-up space-y-3">
              <h2 className="flex items-center gap-2 font-bold text-slate-950">
                <Camera className="size-4 text-brand-600" /> {MEDIA_SECTION_LABEL[g.s]}
                <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-xs font-semibold text-slate-600">{g.list.length}</span>
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {g.list.map((m) => {
                  const j = byId(state.jobs, m.jobId);
                  const v = j ? byId(state.vehicles, j.vehicleId) : undefined;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setOpen(m)}
                      className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-900 text-left shadow-sm ring-1 ring-slate-200/70 transition hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      <img src={m.type === "video" ? m.poster ?? "" : m.url} alt={m.caption} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent" />
                      {m.type === "video" && (
                        <span className="absolute left-1/2 top-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-slate-900 shadow-lg">
                          <Play className="size-5 fill-current" />
                        </span>
                      )}
                      {m.item && (
                        <span className="absolute left-2.5 top-2.5 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-bold uppercase text-white backdrop-blur">{m.item}</span>
                      )}
                      <div className="absolute inset-x-0 bottom-0 p-3">
                        <p className="line-clamp-2 text-sm font-semibold text-white">{m.caption}</p>
                        <p className="mt-0.5 truncate text-[11px] text-slate-300">
                          {v ? vehicleLabel(v) : m.jobId} · {relStamp(m.takenAt, state.anchorDay)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm" onClick={() => setOpen(null)} role="dialog" aria-modal="true">
          <div className="anim-fade-up w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center gap-3 text-white">
              <div className="min-w-0 flex-1">
                <input
                  key={open.id}
                  defaultValue={open.caption}
                  onBlur={(e) => e.target.value.trim() && updateMedia(open.id, { caption: e.target.value.trim() })}
                  aria-label="Caption"
                  className="w-full rounded-lg bg-transparent px-1 font-semibold outline-none ring-white/30 focus:ring-2"
                />
                <p className="truncate px-1 text-xs text-slate-400">
                  {MEDIA_SECTION_LABEL[open.section]}{open.item ? ` · ${open.item.toUpperCase()}` : ""} · {jobLabel(open.jobId)} · {byId(state.team, open.by)?.name ?? ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  removeMedia(open.id);
                  setOpen(null);
                }}
                aria-label="Delete"
                className="grid size-10 place-items-center rounded-full bg-white/10 hover:bg-red-600"
              >
                <Trash2 className="size-4" />
              </button>
              <button type="button" onClick={() => setOpen(null)} aria-label="Close" className="grid size-10 place-items-center rounded-full bg-white/10 hover:bg-white/20">
                <X className="size-5" />
              </button>
            </div>
            <div className="overflow-hidden rounded-2xl bg-black">
              {open.type === "video" ? (
                <video src={open.url} poster={open.poster} controls playsInline className="max-h-[75dvh] w-full" />
              ) : (
                <img src={open.url} alt={open.caption} className="max-h-[75dvh] w-full object-contain" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Chip({ active, label, count, onClick }: { active: boolean; label: string; count: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition ${active ? "bg-slate-950 text-white shadow" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:text-slate-900"}`}
    >
      {label}
      <span className={`rounded-full px-1.5 text-[11px] ${active ? "bg-white/15" : "bg-slate-100 text-slate-500"}`}>{count}</span>
    </button>
  );
}
