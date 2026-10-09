"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Camera, ChevronLeft, ChevronRight, Loader2, RotateCcw, Trash2, Video, X } from "lucide-react";
import type { MediaSection } from "@/lib/data";
import { addMedia, removeMedia, updateMedia, useMe, useShop } from "@/lib/store";
import { fmtTime, nowISO } from "@/lib/utils";

export type CaptureTarget = { section: MediaSection; item?: string; title: string };

/** Downscale a photo to a JPEG data URL so it can be stored in the browser (demo has no file server). */
export async function compressImage(file: File, max = 1280, quality = 0.72): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("Could not read image"));
      i.src = url;
    });
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No canvas");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}

type Pending = { url: string; type: "photo" | "video"; file: File };

export function PhotoCapture({
  jobId,
  vehicleId,
  target,
  onClose,
}: {
  jobId: string;
  vehicleId: string;
  target: CaptureTarget;
  onClose: () => void;
}) {
  const state = useShop();
  const me = useMe();
  const items = state.media.filter(
    (m) => m.jobId === jobId && m.section === target.section && (target.item ? m.item === target.item : true),
  );
  const [pending, setPending] = useState<Pending | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id ?? null);
  const [addNote, setAddNote] = useState(false);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  const selected = items.find((m) => m.id === selectedId) ?? items[0] ?? null;

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (pending) URL.revokeObjectURL(pending.url);
    setPending({ url: URL.createObjectURL(file), type: file.type.startsWith("video") ? "video" : "photo", file });
  }

  async function save() {
    if (!pending) return;
    setSaving(true);
    let url = pending.url;
    if (pending.type === "photo") {
      try {
        url = await compressImage(pending.file);
        URL.revokeObjectURL(pending.url);
      } catch {
        // keep the session URL if the browser can't decode (e.g. HEIC on desktop)
      }
    }
    const id = addMedia({
      jobId,
      vehicleId,
      section: target.section,
      item: target.item,
      type: pending.type,
      url,
      caption: addNote && note.trim() ? note.trim() : target.title,
      takenAt: nowISO(),
      by: me.id,
    });
    setPending(null);
    setSelectedId(id);
    setAddNote(false);
    setNote("");
    setSaving(false);
  }

  function retake() {
    if (pending?.type === "video") videoRef.current?.click();
    else photoRef.current?.click();
  }

  const scroll = (dir: number) => stripRef.current?.scrollBy({ left: dir * 160, behavior: "smooth" });
  const show = pending ? { url: pending.url, type: pending.type } : selected ? { url: selected.url, type: selected.type, poster: selected.poster } : null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/70 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={target.title}>
      <div className="anim-fade-up flex max-h-[96dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
          <button type="button" onClick={onClose} aria-label="Back" className="grid size-9 place-items-center rounded-full text-slate-600 hover:bg-slate-100">
            <ChevronLeft className="size-5" />
          </button>
          <h2 className="min-w-0 flex-1 truncate text-base font-bold text-slate-950">{target.title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-9 place-items-center rounded-full text-slate-600 hover:bg-slate-100">
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto p-4">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-900">
            {show ? (
              show.type === "video" ? (
                <video key={show.url} src={show.url} poster={"poster" in show ? show.poster : undefined} controls playsInline className="h-full w-full object-contain" />
              ) : (
                <img src={show.url} alt={target.title} className="h-full w-full object-cover" />
              )
            ) : (
              <button type="button" onClick={() => photoRef.current?.click()} className="flex h-full w-full flex-col items-center justify-center gap-3 text-slate-300">
                <span className="grid size-16 place-items-center rounded-full bg-white/10 ring-1 ring-white/20">
                  <Camera className="size-7" />
                </span>
                <span className="text-sm font-semibold">Tap to take a photo</span>
                <span className="text-xs text-slate-400">Hold the tread gauge in frame</span>
              </button>
            )}
            {pending && (
              <span className="absolute left-3 top-3 rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-bold text-slate-950">Not saved yet</span>
            )}
            {!pending && selected && (
              <span className="absolute bottom-3 left-3 right-3 truncate rounded-lg bg-black/55 px-2.5 py-1.5 text-xs text-white backdrop-blur">
                {selected.caption} · {fmtTime(selected.takenAt)}
              </span>
            )}
          </div>

          {pending ? (
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={retake} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-100 font-semibold text-slate-800 hover:bg-slate-200">
                <RotateCcw className="size-4" /> Retake
              </button>
              <button type="button" onClick={save} disabled={saving} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-70">
                {saving && <Loader2 className="size-4 animate-spin" />}
                {pending.type === "video" ? "Save Video" : "Save Photo"}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => photoRef.current?.click()} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 font-semibold text-white shadow-sm hover:bg-blue-700">
                <Camera className="size-4" /> Take Photo
              </button>
              <button type="button" onClick={() => videoRef.current?.click()} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-100 font-semibold text-slate-800 hover:bg-slate-200">
                <Video className="size-4" /> Record Video
              </button>
            </div>
          )}

          <input ref={photoRef} type="file" accept="image/*" capture="environment" className="sr-only" onChange={onFile} />
          <input ref={videoRef} type="file" accept="video/*" capture="environment" className="sr-only" onChange={onFile} />

          {items.length > 0 && (
            <div className="relative">
              <button type="button" onClick={() => scroll(-1)} aria-label="Previous" className="absolute -left-1 top-1/2 z-10 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white shadow ring-1 ring-slate-200">
                <ChevronLeft className="size-4" />
              </button>
              <div ref={stripRef} className="no-scrollbar mx-8 flex snap-x gap-2 overflow-x-auto">
                {items.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setPending(null);
                      setSelectedId(m.id);
                    }}
                    className={`relative h-16 w-20 shrink-0 snap-start overflow-hidden rounded-lg ring-2 transition ${
                      !pending && selected?.id === m.id ? "ring-blue-600" : "ring-transparent opacity-80 hover:opacity-100"
                    }`}
                  >
                    <img src={m.type === "video" ? m.poster ?? "" : m.url} alt={m.caption} className="h-full w-full object-cover" />
                    {m.type === "video" && <Video className="absolute bottom-1 right-1 size-3.5 text-white drop-shadow" />}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => scroll(1)} aria-label="Next" className="absolute -right-1 top-1/2 z-10 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white shadow ring-1 ring-slate-200">
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}

          {pending ? (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input type="checkbox" checked={addNote} onChange={(e) => setAddNote(e.target.checked)} className="size-4 rounded border-slate-300 accent-blue-600" />
                Add note to this photo
              </label>
              {addNote && (
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Uneven wear on outer edge."
                  className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
                  autoFocus
                />
              )}
            </div>
          ) : (
            selected && (
              <div className="flex items-center gap-2">
                <input
                  key={selected.id}
                  defaultValue={selected.caption}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v && v !== selected.caption) updateMedia(selected.id, { caption: v });
                  }}
                  aria-label="Photo note"
                  className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
                />
                <button
                  type="button"
                  onClick={() => {
                    removeMedia(selected.id);
                    setSelectedId(null);
                  }}
                  aria-label="Delete photo"
                  className="grid size-11 shrink-0 place-items-center rounded-xl text-slate-400 ring-1 ring-slate-200 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            )
          )}

          <p className="text-center text-[11px] text-slate-400">
            {items.length} saved to this vehicle&apos;s history · photos stay in this browser for the demo
          </p>
        </div>
      </div>
    </div>
  );
}
