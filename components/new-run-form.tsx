"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface Draft {
  id: string;
  file: File;
  url: string;
  label: string;
  width: number;
  height: number;
}

// Worst realistic case: a phone throttled after its data pack runs out (~64kbps).
const loadThrottled = (bytes: number) => (bytes / 12000).toFixed(1);

export default function NewRunForm() {
  const router = useRouter();
  const [screens, setScreens] = useState<Draft[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    Array.from(list)
      .filter((f) => f.type.startsWith("image/"))
      .forEach((file) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () =>
          setScreens((prev) => [
            ...prev,
            {
              id: `${file.name}-${prev.length}-${file.size}`,
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

  const ready = screens.length > 0 && description.trim().length > 0 && !submitting;

  return (
    <div className="space-y-8">
      {/* Screens */}
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
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors ${
            dragOver ? "border-terra bg-terra-tint" : "border-line bg-card hover:border-ink-soft"
          }`}
        >
          <p className="font-medium">Drop screenshots here, or click to choose</p>
          <p className="mt-1 text-[13px] text-ink-soft">
            PNG or JPG · one image per screen · order matters, you can rearrange below
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

        {screens.length > 0 && (
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
                    placeholder={`Label — "Payment", "Documents"…`}
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

      {/* Description */}
      <section>
        <label htmlFor="title" className="mb-2 block font-display text-[11px] font-semibold uppercase tracking-[0.18em] text-ink">
          Name this run
        </label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Sehat Sathi — doctor consultation booking"
          className="w-full rounded-lg border border-line bg-card px-3.5 py-2.5 text-[15px] outline-none transition-colors placeholder:text-ink-soft/60 focus:border-ink-soft"
        />
        <label htmlFor="description" className="mb-2 mt-6 block font-display text-[11px] font-semibold uppercase tracking-[0.18em] text-ink">
          What does this flow do, and for whom?
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Books a video consultation with a doctor. Users pick a doctor, choose a slot, upload records if they have them, and pay ₹299 by UPI before the call."
          className="w-full resize-y rounded-lg border border-line bg-card px-3.5 py-2.5 text-[15px] leading-relaxed outline-none transition-colors placeholder:text-ink-soft/60 focus:border-ink-soft"
        />
        <p className="mt-1.5 text-[12px] text-ink-soft">
          The more honest the description, the harsher — and more useful — the report.
        </p>
      </section>

      {notice && (
        <div className="rounded-lg border border-warn/30 bg-warn-tint px-4 py-3 text-[14px]">{notice}</div>
      )}

      <button
        onClick={submit}
        disabled={!ready}
        className="w-full rounded-full bg-ink px-6 py-3 text-[15px] font-medium text-paper transition-colors hover:bg-terra-deep disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
      >
        {submitting ? "Setting up the run…" : "Run it past five users →"}
      </button>
    </div>
  );
}
