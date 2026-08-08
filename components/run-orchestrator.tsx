"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ResultsView from "@/components/results-view";
import type { Persona, RunReport } from "@/lib/types";

type Phase = "personas" | "review" | "walking" | "done" | "error";

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

function outcomeBadge(p: Persona) {
  if (p.outcome === "dropped")
    return { label: `Left at screen ${p.dropped_at_screen}`, cls: "bg-bad-tint text-bad" };
  if (p.outcome === "struggled")
    return { label: "Finished, struggled", cls: "bg-warn-tint text-warn" };
  return { label: "Completed", cls: "bg-ok-tint text-ok" };
}

export default function RunOrchestrator({ initial }: { initial: RunReport }) {
  const router = useRouter();
  const [personas, setPersonas] = useState<Persona[]>(initial.personas);
  const [phase, setPhase] = useState<Phase>(() => {
    if (initial.personas.length === 0) return "personas";
    // Personas already exist: resume walking if any are done, else wait for the
    // user to kick off the walkthrough.
    return initial.personas.some(isComplete) ? "walking" : "review";
  });
  const [error, setError] = useState<string | null>(null);
  const genStarted = useRef(false);
  const walkStarted = useRef(false);

  // Generate personas once, if we don't have them yet.
  useEffect(() => {
    if (phase !== "personas" || genStarted.current) return;
    genStarted.current = true;
    (async () => {
      try {
        const res = await fetch(`/api/runs/${initial.id}/personas`, { method: "POST" });
        const body = await readBody(res);
        if (!res.ok) {
          throw new Error(
            typeof body.error === "string"
              ? body.error
              : "Generating users timed out. Please try running it again.",
          );
        }
        const roster = ((body.personas ?? []) as Persona[]).map((p) => ({ ...p, steps: [] }));
        setPersonas(roster);
        setPhase("review");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
        setPhase("error");
      }
    })();
  }, [phase, initial.id]);

  // Walk the personas — kicked off by the button, or auto-resumed on reload.
  const startWalking = () => {
    if (walkStarted.current) return;
    walkStarted.current = true;
    setPhase("walking");
    (async () => {
      await Promise.all(
        personas.map(async (p) => {
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
    })();
  };

  // Auto-resume if we loaded into a half-finished walk.
  useEffect(() => {
    if (phase === "walking" && !walkStarted.current) startWalking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  if (phase === "done") {
    return <ResultsView report={{ ...initial, status: "done", personas }} />;
  }

  const doneCount = personas.filter(isComplete).length;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-24 sm:px-6">
      <header className="pb-6 pt-10 sm:pt-14">
        <p className="mb-2 flex items-center gap-2 font-display text-[11px] font-semibold uppercase tracking-[0.18em] text-terra">
          {phase !== "review" && (
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-terra" />
          )}
          {phase === "personas"
            ? "Assembling your users"
            : phase === "review"
              ? "Your five testers"
              : "Walking them through"}
        </p>
        <h1 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
          {initial.title}
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
          {phase === "personas"
            ? "Generating five non-urban Indian users grounded in language, device, connection and prior experience…"
            : phase === "review"
              ? "These are the people who'll walk your flow — each shaped by a different real constraint. Review them, then send them through your screens."
              : `${doneCount} of ${personas.length} have finished walking through your ${initial.screens.length} screens. Each appears the moment they're done.`}
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-lg border border-bad/30 bg-bad-tint px-4 py-3 text-[14px]">
          {error}
        </div>
      )}

      {/* Walk button — top of the review step so it's obvious */}
      {phase === "review" && (
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <button
            onClick={startWalking}
            className="rounded-full bg-ink px-5 py-2.5 text-[15px] font-medium text-paper transition-colors hover:bg-terra-deep"
          >
            Walk them through your {initial.screens.length} screen
            {initial.screens.length > 1 ? "s" : ""} →
          </button>
          <span className="text-[13px] text-ink-soft">
            Five walkthroughs, one per user — takes about a minute.
          </span>
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
              <span className="flex-1 space-y-1.5">
                <span className="block h-3 w-40 animate-pulse rounded bg-paper-deep" />
                <span className="block h-2.5 w-full max-w-md animate-pulse rounded bg-paper-deep/70" />
              </span>
            </div>
          ))}

        {personas.map((p, i) => {
          const complete = isComplete(p);
          const review = phase === "review";
          const badge = complete ? outcomeBadge(p) : null;
          return (
            <div
              key={p.id}
              className="rise flex items-start gap-3 rounded-lg border border-line bg-card px-4 py-3.5 sm:gap-4 sm:px-5"
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-sm font-semibold ${TONES[i % TONES.length]}`}
              >
                {p.initials}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">
                  {p.name} <span className="text-ink-soft">{p.age}</span>
                </span>
                <span className="block text-[12px] uppercase tracking-wider text-ink-soft">
                  {p.language} · {p.connection} · {p.device}
                </span>
                {/* In review, show the full lens; while walking, keep it tight. */}
                <span
                  className={`mt-1 block text-[13px] leading-relaxed text-ink-soft ${review ? "" : "truncate"}`}
                >
                  {review ? p.context : p.context.split("·")[0].trim()}
                </span>
              </span>
              {badge ? (
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${badge.cls}`}>
                  {badge.label}
                </span>
              ) : phase === "walking" ? (
                <span className="flex shrink-0 items-center gap-1.5 pt-0.5 text-xs text-ink-soft">
                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-terra" />
                  walking…
                </span>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Repeat the button at the bottom for long persona lists */}
      {phase === "review" && personas.length > 0 && (
        <button
          onClick={startWalking}
          className="mt-6 rounded-full bg-ink px-5 py-2.5 text-[15px] font-medium text-paper transition-colors hover:bg-terra-deep"
        >
          Walk them through →
        </button>
      )}
    </div>
  );
}
