"use client";

import { useMemo, useState } from "react";
import { Camera, CheckCircle2, Image as ImageIcon, Play, Upload, Video, X } from "lucide-react";
import { Card, EmptyState } from "@/components/ui";
import { CATEGORIES, CATEGORY_LABEL, JOBS, TEAM, type Category, type Media } from "@/lib/data";
import { findVehicle, vehicleLabel } from "@/lib/utils";

type TypeFilter = "all" | "photo" | "video";

export function MediaLibrary({
  initialMedia,
  initialCategory,
  initialJob,
}: {
  initialMedia: Media[];
  initialCategory: Category | "all";
  initialJob: string;
}) {
  const [items, setItems] = useState<Media[]>(initialMedia);
  const [category, setCategory] = useState<Category | "all">(initialCategory);
  const [jobFilter, setJobFilter] = useState<string>(initialJob || "all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [open, setOpen] = useState<Media | null>(null);
  const [uploadCategory, setUploadCategory] = useState<Category>(
    initialCategory === "all" ? "tires" : initialCategory,
  );
  const [uploadJob, setUploadJob] = useState<string>(initialJob || JOBS[0].id);
  const [uploadBy, setUploadBy] = useState<string>(TEAM[1].id);
  const [message, setMessage] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      items.filter(
        (m) =>
          (category === "all" || m.category === category) &&
          (jobFilter === "all" || m.jobId === jobFilter) &&
          (typeFilter === "all" || m.type === typeFilter),
      ),
    [items, category, jobFilter, typeFilter],
  );

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const job = JOBS.find((j) => j.id === uploadJob) ?? JOBS[0];
    const now = new Date();
    const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const added: Media[] = Array.from(files).map((file, i) => ({
      id: `U-${Date.now()}-${i}`,
      jobId: job.id,
      vehicleId: job.vehicleId,
      category: uploadCategory,
      type: file.type.startsWith("video") ? "video" : "photo",
      url: URL.createObjectURL(file),
      title: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
      takenAt: stamp,
      uploadedBy: uploadBy,
    }));
    setItems((prev) => [...added, ...prev]);
    setMessage(`${added.length} file${added.length > 1 ? "s" : ""} added to ${job.id} · ${CATEGORY_LABEL[uploadCategory]}.`);
    setCategory(uploadCategory);
    setJobFilter(job.id);
  }

  const counts = useMemo(() => {
    const base = items.filter((m) => jobFilter === "all" || m.jobId === jobFilter);
    return Object.fromEntries(
      CATEGORIES.map((c) => [c.id, base.filter((m) => m.category === c.id).length]),
    ) as Record<Category, number>;
  }, [items, jobFilter]);

  const grouped = CATEGORIES.map((c) => ({ ...c, list: filtered.filter((m) => m.category === c.id) })).filter(
    (g) => g.list.length > 0,
  );

  return (
    <div className="space-y-6">
      {/* Upload */}
      <Card className="anim-fade-up overflow-hidden">
        <div className="grid gap-0 md:grid-cols-[1fr_1.2fr]">
          <div className="bg-gradient-to-br from-slate-950 to-slate-800 p-6 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">Phone-ready upload</p>
            <h2 className="mt-2 text-xl font-bold">Snap it, tag it, done.</h2>
            <p className="mt-2 text-sm text-slate-300">
              On a phone, tapping upload opens the camera so you can take a photo or a short video.
              Each file is filed under the job and inspection category you pick.
            </p>
          </div>
          <div className="space-y-4 p-6">
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Job
                <select value={uploadJob} onChange={(e) => setUploadJob(e.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm font-normal normal-case tracking-normal outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/15">
                  {JOBS.map((j) => (
                    <option key={j.id} value={j.id}>{j.id} · {vehicleLabel(findVehicle(j.vehicleId)!)}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Category
                <select value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value as Category)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm font-normal normal-case tracking-normal outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/15">
                  {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </label>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Uploaded by
                <select value={uploadBy} onChange={(e) => setUploadBy(e.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm font-normal normal-case tracking-normal outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/15">
                  {TEAM.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </label>
            </div>
            <label className="group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/50 px-4 py-7 text-center transition hover:border-amber-500 hover:bg-amber-50">
              <span className="grid size-12 place-items-center rounded-full bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/30 transition group-hover:scale-110">
                <Upload className="size-5" />
              </span>
              <span className="font-semibold text-slate-900">Tap to take photo or choose video</span>
              <span className="text-xs text-slate-500">JPG, PNG, HEIC, MP4, MOV · works from iPhone, Android, tablet or PC</span>
              <input
                type="file"
                accept="image/*,video/*"
                capture="environment"
                multiple
                className="sr-only"
                onChange={(e) => {
                  handleFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
            {message && (
              <p className="anim-fade-up flex items-center gap-2 text-sm text-emerald-700">
                <CheckCircle2 className="size-4" /> {message}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Filters */}
      <div className="space-y-3">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <Chip active={category === "all"} onClick={() => setCategory("all")} label="All categories" count={filtered.length} />
          {CATEGORIES.map((c) => (
            <Chip key={c.id} active={category === c.id} onClick={() => setCategory(c.id)} label={c.label} count={counts[c.id]} />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={jobFilter} onChange={(e) => setJobFilter(e.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/15">
            <option value="all">All jobs & vehicles</option>
            {JOBS.map((j) => (
              <option key={j.id} value={j.id}>{j.id} · {vehicleLabel(findVehicle(j.vehicleId)!)}</option>
            ))}
          </select>
          <div className="flex rounded-xl bg-white p-1 ring-1 ring-slate-200">
            {(["all", "photo", "video"] as TypeFilter[]).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold capitalize transition ${typeFilter === t ? "bg-slate-950 text-white" : "text-slate-600 hover:text-slate-900"}`}
              >
                {t === "photo" && <ImageIcon className="size-3.5" />}
                {t === "video" && <Video className="size-3.5" />}
                {t === "all" ? "All media" : t === "photo" ? "Photos" : "Videos"}
              </button>
            ))}
          </div>
          <span className="ml-auto text-xs text-slate-500">{filtered.length} item{filtered.length === 1 ? "" : "s"}</span>
        </div>
      </div>

      {/* Gallery grouped by inspection category */}
      {grouped.length === 0 ? (
        <EmptyState title="No media for these filters" text="Try another category or upload a new photo or video." />
      ) : (
        <div className="space-y-8">
          {grouped.map((g) => (
            <section key={g.id} className="anim-fade-up space-y-3">
              <div className="flex items-center gap-2">
                <Camera className="size-4 text-amber-600" />
                <h2 className="font-semibold text-slate-950">{g.label}</h2>
                <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-xs font-semibold text-slate-600">{g.list.length}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {g.list.map((m) => (
                  <MediaTile key={m.id} media={m} onOpen={() => setOpen(m)} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {open && <Lightbox media={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function Chip({ active, label, count, onClick }: { active: boolean; label: string; count: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition ${
        active ? "bg-slate-950 text-white shadow" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:text-slate-900"
      }`}
    >
      {label}
      <span className={`rounded-full px-1.5 text-[11px] ${active ? "bg-white/15" : "bg-slate-100 text-slate-500"}`}>{count}</span>
    </button>
  );
}

function MediaTile({ media, onOpen }: { media: Media; onOpen: () => void }) {
  const job = JOBS.find((j) => j.id === media.jobId);
  const vehicle = findVehicle(media.vehicleId);
  return (
    <button
      onClick={onOpen}
      className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-900 text-left shadow-sm ring-1 ring-slate-200/70 transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <img
        src={media.type === "video" ? media.poster ?? media.url : media.url}
        alt={media.title}
        loading="lazy"
        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/10 to-transparent" />
      {media.type === "video" && (
        <span className="absolute left-1/2 top-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-slate-900 shadow-lg transition group-hover:scale-110">
          <Play className="size-5 fill-current" />
        </span>
      )}
      <span className="absolute left-2.5 top-2.5 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur">
        {media.type === "video" ? "Video" : "Photo"}
      </span>
      <div className="absolute inset-x-0 bottom-0 p-3">
        <p className="line-clamp-2 text-sm font-semibold capitalize text-white">{media.title}</p>
        <p className="mt-0.5 truncate text-[11px] text-slate-300">
          {job?.id} · {vehicle ? vehicleLabel(vehicle) : ""}
        </p>
      </div>
    </button>
  );
}

function Lightbox({ media, onClose }: { media: Media; onClose: () => void }) {
  const vehicle = findVehicle(media.vehicleId);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true">
      <div className="anim-fade-up w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between text-white">
          <div className="min-w-0">
            <p className="truncate font-semibold capitalize">{media.title}</p>
            <p className="truncate text-xs text-slate-400">
              {CATEGORY_LABEL[media.category]} · {media.jobId} · {vehicle ? vehicleLabel(vehicle) : ""} · {media.takenAt}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="grid size-10 place-items-center rounded-full bg-white/10 hover:bg-white/20">
            <X className="size-5" />
          </button>
        </div>
        <div className="overflow-hidden rounded-2xl bg-black">
          {media.type === "video" ? (
            <video src={media.url} poster={media.poster} controls playsInline preload="metadata" className="max-h-[75dvh] w-full" />
          ) : (
            <img src={media.url} alt={media.title} className="max-h-[75dvh] w-full object-contain" />
          )}
        </div>
      </div>
    </div>
  );
}
