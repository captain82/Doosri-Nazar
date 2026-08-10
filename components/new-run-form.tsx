"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SAMPLES, type Sample } from "@/lib/samples";

interface Draft {
  id: string;
  file: File;
  url: string;
  label: string;
  width: number;
  height: number;
}

type Phase = "upload" | "reading" | "details";

// Worst realistic case: a phone throttled after its data pack runs out (~64kbps).
const loadThrottled = (bytes: number) => (bytes / 12000).toFixed(1);

export default function NewRunForm() {
  const router = useRouter();
  const [screens, setScreens] = useState<Draft[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [inferFailed, setInferFailed] = useState(false);
  const [phase, setPhase] = useState<Phase>("upload");
  const [dragOver, setDragOver] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [loadingSample, setLoadingSample] = useState<string | null>(null);
  const [fromSample, setFromSample] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleTouched = useRef(false);
  const descTouched = useRef(false);
  const readKey = useRef<string | null>(null);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    setFromSample(false);
    Array.from(list)
      .filter((f) => f.type.startsWith("image/"))
      .forEach((file) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () =>
          setScreens((prev) => [
            ...prev,
            {
              id: `${file.name}-${prev.length}-${file.size}-${img.naturalWidth}`,
              file,
              url,
              label: "",
              width: img.naturalWidth,
              height: img.naturalHeight,
            },
          ]);
        img.src = url;
      });
  };

  // Paste a screenshot straight in (⌘V) while on the upload step.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (phase !== "upload") return;
      const files = e.clipboardData?.files;
      if (files && files.length) addFiles(files);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [phase]);

  const move = (from: number, to: number) =>
    setScreens((prev) => {
      if (to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });

  const remove = (idx: number) =>
    setScreens((prev) => {
      URL.revokeObjectURL(prev[idx].url);
      return prev.filter((_, i) => i !== idx);
    });

  // Next → read all screens, prefill, then reveal the details step. Skips the
  // read if the same set of screens was already read (e.g. after going Back).
  const next = async () => {
    const key = screens.map((s) => s.id).join(",");
    if (readKey.current === key) {
      setPhase("details");
      return;
    }
    setPhase("reading");
    setInferFailed(false);
    try {
      const fd = new FormData();
      screens.forEach((s) => fd.append("screens", s.file));
      const res = await fetch("/api/infer", { method: "POST", body: fd });
      if (!res.ok) throw new Error();
      const d = await res.json();
      if (d.category) setCategory(d.category);
      if (d.title && !titleTouched.current) setTitle(d.title);
      if (d.description && !descTouched.current) setDescription(d.description);
      readKey.current = key;
    } catch {
      setInferFailed(true);
    } finally {
      setPhase("details");
    }
  };

  // Load a ready-made sample: fetch its mock screenshots as files, prefill the
  // curated title/description/category, then jump straight to the run step
  // (no "read your screens" call needed).
  const loadSample = async (s: Sample) => {
    if (loadingSample) return;
    setLoadingSample(s.id);
    setNotice(null);
    try {
      const drafts: Draft[] = await Promise.all(
        s.screens.map(async (sc, i) => {
          const blob = await (await fetch(sc.src)).blob();
          const file = new File([blob], `${s.id}-${i + 1}.png`, { type: "image/png" });
          const url = URL.createObjectURL(blob);
          const dim = await new Promise<{ w: number; h: number }>((resolve) => {
            const img = new Image();
            img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
            img.onerror = () => resolve({ w: 390, h: 844 });
            img.src = url;
          });
          return { id: `${s.id}-${i}`, file, url, label: sc.label, width: dim.w, height: dim.h };
        }),
      );
      setScreens(drafts);
      setTitle(s.title);
      setDescription(s.description);
      setCategory(s.category);
      titleTouched.current = true;
      descTouched.current = true;
      readKey.current = drafts.map((d) => d.id).join(",");
      setFromSample(true);
      setPhase("details");
    } catch {
      setNotice("Could not load the sample. Please try again.");
    } finally {
      setLoadingSample(null);
    }
  };

  const submit = async () => {
    setSubmitting(true);
    setNotice(null);
    try {
      const form = new FormData();
      form.set("title", title);
      form.set("description", description);
      screens.forEach((s, i) => {
        form.append("screens", s.file);
        form.append("labels", s.label);
        form.append("positions", String(i + 1));
      });
      const res = await fetch("/api/runs", { method: "POST", body: form });
      const body = await res.json();
      if (!res.ok) {
        setNotice(body.error ?? "Something went wrong.");
        return;
      }
      router.push(`/runs/${body.runId}`);
    } catch {
      setNotice("Could not reach the server. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const hasScreens = screens.length > 0;

  // ── Reading (loader) ────────────────────────────────────────────────
  if (phase === "reading") {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-line bg-card px-6 py-20 text-center">
        <div className="flex gap-1.5" aria-hidden>
          <span className="h-2 w-2 animate-bounce rounded-full bg-terra [animation-delay:-0.3s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-terra [animation-delay:-0.15s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-terra" />
        </div>
        <p className="mt-5 font-display text-lg font-semibold">Reading your screens…</p>
        <p className="mt-1.5 max-w-sm text-[14px] text-ink-soft">
          Understanding the flow so you don&apos;t have to describe it. This takes a few seconds.
        </p>
      </div>
    );
  }

  // ── Details (filled-in, editable) ───────────────────────────────────
  if (phase === "details") {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setPhase("upload")}
          className="text-[13px] text-ink-soft transition-colors hover:text-ink"
        >
          ← Back to screens ({screens.length})
        </button>

        <div className="flex items-center gap-2 text-[13px]">
          {fromSample ? (
            <span className="text-ink-soft">
              Sample flow loaded, {screens.length} screen{screens.length > 1 ? "s" : ""}. Just run it below, or
              tweak the details first.
            </span>
          ) : inferFailed ? (
            <span className="text-ink-soft">
              Couldn&apos;t auto-read the screens, add a name and description yourself, or just run it.
            </span>
          ) : category ? (
            <span className="text-ink-soft">
              We read your {screens.length} screen{screens.length > 1 ? "s" : ""}. Looks like{" "}
              <span className="rounded-full border border-line bg-card px-2 py-0.5 font-medium text-ink">
                {category}
              </span>{" "}, edit anything below, or just run it.
            </span>
          ) : null}
        </div>

        <div>
          <label htmlFor="title" className="mb-1.5 block font-display text-[11px] font-semibold uppercase tracking-[0.18em] text-ink">
            Name this run
          </label>
          <input
            id="title"
            value={title}
            onChange={(e) => {
              titleTouched.current = true;
              setTitle(e.target.value);
            }}
            placeholder="Give this run a name"
            className="w-full rounded-lg border border-line bg-card px-3.5 py-2.5 text-[15px] outline-none transition-colors placeholder:text-ink-soft/60 focus:border-ink-soft"
          />
        </div>

        <div>
          <label htmlFor="description" className="mb-1.5 block font-display text-[11px] font-semibold uppercase tracking-[0.18em] text-ink">
            What this flow does <span className="font-normal normal-case tracking-normal text-ink-soft">(optional)</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => {
              descTouched.current = true;
              setDescription(e.target.value);
            }}
            rows={4}
            placeholder="We infer this from your screens, leave it or refine it."
            className="w-full resize-y rounded-lg border border-line bg-card px-3.5 py-2.5 text-[15px] leading-relaxed outline-none transition-colors placeholder:text-ink-soft/60 focus:border-ink-soft"
          />
          <p className="mt-1.5 text-[12px] text-ink-soft">
            Add anything we can&apos;t see, hidden rules, what happens after payment, to sharpen the report.
          </p>
        </div>

        {notice && (
          <div className="rounded-lg border border-warn/30 bg-warn-tint px-4 py-3 text-[14px]">{notice}</div>
        )}

        <button
          onClick={submit}
          disabled={submitting}
          className="w-full rounded-full bg-ink px-6 py-3 text-[15px] font-medium text-paper transition-colors hover:bg-terra-deep disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
        >
          {submitting ? "Setting up the run…" : "Run it past five users →"}
        </button>
      </div>
    );
  }

  // ── Upload (arrange all screens) ────────────────────────────────────
  return (
    <div className="space-y-6">
      <section>
        <label className="mb-2 block font-display text-[11px] font-semibold uppercase tracking-[0.18em] text-ink">
          Screens, in the order users see them
        </label>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (dragIdx === null) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (dragIdx === null) addFiles(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed text-center transition-colors ${
            hasScreens ? "px-6 py-6" : "px-6 py-14"
          } ${dragOver ? "border-terra bg-terra-tint" : "border-line bg-card hover:border-ink-soft"}`}
        >
          <p className="font-medium">
            {hasScreens ? "Add another screen" : "Drop your screenshots here"}
          </p>
          <p className="mt-1 text-[13px] text-ink-soft">
            {hasScreens
              ? "PNG or JPG · order matters, rearrange below"
              : "or paste (⌘V), or click to choose · PNG or JPG, one per screen"}
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        {hasScreens && (
          <ol className="mt-4 space-y-2">
            {screens.map((s, i) => (
              <li
                key={s.id}
                draggable
                onDragStart={() => setDragIdx(i)}
                onDragEnd={() => setDragIdx(null)}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragIdx !== null && dragIdx !== i) {
                    move(dragIdx, i);
                    setDragIdx(i);
                  }
                }}
                className={`flex items-center gap-3 rounded-lg border border-line bg-card p-2.5 sm:gap-4 ${
                  dragIdx === i ? "opacity-60" : ""
                }`}
              >
                <span className="cursor-grab select-none text-ink-soft" title="Drag to reorder" aria-hidden>
                  ⠿
                </span>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-paper font-display text-xs font-semibold tabular-nums">
                  {i + 1}
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.url} alt="" className="h-14 w-9 shrink-0 rounded border border-line object-cover" />
                <div className="min-w-0 flex-1">
                  <input
                    value={s.label}
                    onChange={(e) =>
                      setScreens((prev) => prev.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))
                    }
                    placeholder={`Label (optional), "Payment", "Documents"…`}
                    className="w-full rounded border border-transparent bg-transparent px-1.5 py-1 text-sm outline-none transition-colors placeholder:text-ink-soft/60 focus:border-line focus:bg-paper"
                  />
                  <p className="mt-0.5 px-1.5 text-[11px] tabular-nums text-ink-soft">
                    {Math.round(s.file.size / 1024)} KB · {s.width}×{s.height} · ~{loadThrottled(s.file.size)}s on a throttled phone
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move up" className="rounded px-1.5 py-0.5 text-ink-soft hover:bg-paper disabled:opacity-30">↑</button>
                  <button onClick={() => move(i, i + 1)} disabled={i === screens.length - 1} aria-label="Move down" className="rounded px-1.5 py-0.5 text-ink-soft hover:bg-paper disabled:opacity-30">↓</button>
                  <button onClick={() => remove(i)} aria-label="Remove" className="rounded px-1.5 py-0.5 text-ink-soft hover:bg-bad-tint hover:text-bad">✕</button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <button
        onClick={next}
        disabled={!hasScreens}
        className="w-full rounded-full bg-ink px-6 py-3 text-[15px] font-medium text-paper transition-colors hover:bg-terra-deep disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
      >
        Next →
      </button>
      {!hasScreens && (
        <p className="text-[12px] text-ink-soft">Add your screenshots first, then we&apos;ll read them for you.</p>
      )}

      {/* No screenshots handy? Run a ready-made sample flow. */}
      {!hasScreens && (
        <div className="pt-4">
          <div className="flex items-center gap-3 pb-5">
            <span className="h-px flex-1 bg-line" />
            <span className="font-display text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-soft">
              or
            </span>
            <span className="h-px flex-1 bg-line" />
          </div>
          <p className="font-display text-[11px] font-semibold uppercase tracking-[0.18em] text-ink">
            No screenshots? Start from a sample
          </p>
          <p className="mt-1.5 text-[13px] text-ink-soft">
            Pick a ready-made flow and watch five non-urban users try it. No upload needed.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {SAMPLES.map((s) => (
              <button
                key={s.id}
                onClick={() => loadSample(s)}
                disabled={loadingSample !== null}
                className="group flex flex-col rounded-xl border border-line bg-card p-3.5 text-left transition-colors hover:border-ink-soft disabled:cursor-wait disabled:opacity-60"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl"
                    style={{ backgroundColor: `${s.accent}1a` }}
                  >
                    {s.emoji}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-medium text-ink">{s.label}</span>
                    <span className="block truncate text-[12px] text-ink-soft">{s.blurb}</span>
                  </span>
                  <span className="shrink-0 text-[13px] font-medium text-ink-soft transition-colors group-hover:text-ink">
                    {loadingSample === s.id ? <span className="text-[12px]">Loading…</span> : "→"}
                  </span>
                </div>
                {/* the actual screens this sample will test */}
                <div className="mt-3 flex items-end gap-1.5">
                  {s.screens.map((sc, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={sc.src}
                      alt={sc.label}
                      loading="lazy"
                      className="h-[72px] w-auto rounded-md border border-line bg-white object-cover object-top shadow-sm"
                    />
                  ))}
                  <span className="ml-auto self-center text-[11px] text-ink-soft">
                    {s.screens.length} screens
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
