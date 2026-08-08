"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ResultsView from "@/components/results-view";
import type { Persona, RunReport } from "@/lib/types";

type Phase = "personas" | "walking" | "done" | "error";

const TONES = [
  "bg-terra-tint text-terra-deep",
  "bg-ok-tint text-ok",
  "bg-warn-tint text-warn",
  "bg-[#E4E9F0] text-[#3B5273]",
  "bg-[#EFE3F0] text-[#6D3B73]",
];

const isComplete = (p: Persona) => p.outcome != null && p.steps?.length > 0;

// Read a response safely — a platform-level error (timeout, crash) returns a
// plain-text body, so JSON.parse would throw the cryptic "Unexpected token"
// error. Fall back to the raw text as a message instead.
async function readBody(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { error: text.slice(0, 200) || `Request failed (${res.status}).` };
  }
}

export default function RunOrchestrator({ initial }: { initial: RunReport }) {
  const router = useRouter();
  const [personas, setPersonas] = useState<Persona[]>(initial.personas);
  const [phase, setPhase] = useState<Phase>(
    initial.personas.length ? "walking" : "personas",
  );
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    (async () => {
      try {
        let roster = initial.personas;

        if (roster.length === 0) {
          const res = await fetch(`/api/runs/${initial.id}/personas`, { method: "POST" });
          const body = await readBody(res);
          if (!res.ok) {
            throw new Error(
              typeof body.error === "string"
                ? body.error
                : "Generating users timed out. Please try running it again.",
            );
          }
          roster = ((body.personas ?? []) as Persona[]).map((p) => ({ ...p, steps: [] }));
          setPersonas(roster);
        }

        setPhase("walking");

        // Fire all walks at once; render each persona's card as its walk lands.
        await Promise.all(
          roster.map(async (p) => {
            if (isComplete(p)) return;
            try {
              const res = await fetch(`/api/runs/${initial.id}/personas/${p.id}/walk`, {
                method: "POST",
              });
              const body = await readBody(res);
              const walked: Persona = (body.persona as Persona) ?? p;
              setPersonas((prev) => prev.map((x) => (x.id === p.id ? { ...x, ...walked } : x)));
            } catch {
              /* individual failure: leave the card as-is */
            }
          }),
        );

        await fetch(`/api/runs/${initial.id}/finish`, { method: "POST" });
        setPhase("done");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
        setPhase("error");
      }
    })();
  }, [initial, router]);

  if (phase === "done") {
    return <ResultsView report={{ ...initial, status: "done", personas }} />;
  }

  const doneCount = personas.filter(isComplete).length;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-24 sm:px-6">
      <header className="pb-6 pt-10 sm:pt-14">
        <p className="mb-2 flex items-center gap-2 font-display text-[11px] font-semibold uppercase tracking-[0.18em] text-terra">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-terra" />
          {phase === "personas" ? "Assembling your users" : "Walking them through"}
        </p>
        <h1 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
          {initial.title}
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
          {phase === "personas"
            ? "Generating five non-urban Indian users grounded in language, device, connection and prior experience…"
            : `${doneCount} of ${personas.length} have finished walking through your ${initial.screens.length} screens. Each appears the moment they're done.`}
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-lg border border-bad/30 bg-bad-tint px-4 py-3 text-[14px]">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {personas.length === 0 &&
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rise flex items-center gap-4 rounded-lg border border-line bg-card px-4 py-3.5 sm:px-5"
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <span className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-paper-deep" />
              <span className="h-3 w-40 animate-pulse rounded bg-paper-deep" />
            </div>
          ))}

        {personas.map((p, i) => {
          const complete = isComplete(p);
          return (
            <div
              key={p.id}
              className="rise flex items-center gap-3 rounded-lg border border-line bg-card px-4 py-3.5 sm:gap-4 sm:px-5"
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-sm font-semibold ${TONES[i % TONES.length]}`}
              >
                {p.initials}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">
                  {p.name} <span className="text-ink-soft">{p.age}</span>
                </span>
                <span className="block truncate text-[13px] text-ink-soft">
                  {p.language} · {p.connection} · {p.context.split("·")[0].trim()}
                </span>
              </span>
              {complete ? (
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                    p.outcome === "dropped"
                      ? "bg-bad-tint text-bad"
                      : p.outcome === "struggled"
                        ? "bg-warn-tint text-warn"
                        : "bg-ok-tint text-ok"
                  }`}
                >
                  {p.outcome === "dropped"
                    ? `Left at screen ${p.dropped_at_screen}`
                    : p.outcome === "struggled"
                      ? "Finished, struggled"
                      : "Completed"}
                </span>
              ) : (
                <span className="flex shrink-0 items-center gap-1.5 text-xs text-ink-soft">
                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-terra" />
                  walking…
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
