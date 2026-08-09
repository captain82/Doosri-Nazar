"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ChatDrawer, { type ChatMessage, type PendingAsk } from "@/components/chat-drawer";
import { userQuestions, screenQuestions } from "@/lib/questions";
import { CHAT_STARTERS } from "@/lib/prompts";
import { reportToMarkdown, reportSlug } from "@/lib/report-markdown";
import type { Persona, RunReport, Screen, Step, StepStatus } from "@/lib/types";

// Small row of scoped "ask" chips shown under a card/section.
function AskChips({ questions, onAsk }: { questions: string[]; onAsk: (q: string) => void }) {
  return (
    <div className="no-print mt-3 flex flex-wrap items-center gap-2">
      <span className="font-display text-[10px] font-semibold uppercase tracking-[0.16em] text-terra">Ask</span>
      {questions.map((q) => (
        <button
          key={q}
          onClick={() => onAsk(q)}
          className="rounded-full border border-line bg-paper px-2.5 py-1 text-[12px] text-ink transition-colors hover:border-ink-soft"
        >
          {q}
        </button>
      ))}
    </div>
  );
}

const AVATAR_TONES = [
  "bg-terra-tint text-terra-deep",
  "bg-ok-tint text-ok",
  "bg-warn-tint text-warn",
  "bg-[#E4E9F0] text-[#3B5273]",
  "bg-[#EFE3F0] text-[#6D3B73]",
];

const STEP_DOT: Record<StepStatus, string> = {
  ok: "bg-ok-tint text-ok border-ok/30",
  friction: "bg-warn-tint text-warn border-warn/30",
  dropped: "bg-bad-tint text-bad border-bad/30",
};

const OUTCOME_RANK = { dropped: 0, struggled: 1, completed: 2 } as const;

function outcomeBadge(p: Persona) {
  if (p.outcome === "dropped")
    return { label: `Left at screen ${p.dropped_at_screen}`, cls: "bg-bad-tint text-bad" };
  if (p.outcome === "struggled")
    return { label: "Finished, struggled", cls: "bg-warn-tint text-warn" };
  return { label: "Completed", cls: "bg-ok-tint text-ok" };
}

function contextLine(p: Persona) {
  const detail = p.context.split("·")[0].trim();
  return `${p.language} · ${p.connection} · ${detail}`;
}

function MetricTags({ step, persona }: { step: Step; persona: Persona }) {
  if (step.metrics.load_seconds == null) return null;
  return (
    <span className="inline-block rounded border border-line bg-paper px-1.5 py-0.5 text-[11px] tabular-nums text-ink-soft">
      {step.metrics.load_seconds.toFixed(1)}s to load · {persona.connection}
    </span>
  );
}

function Suggestion({ text }: { text: string }) {
  return (
    <div className="mt-2 rounded-md border border-terra/20 bg-terra-tint px-3 py-2">
      <span className="mr-1.5 font-display text-[11px] font-semibold uppercase tracking-wider text-terra-deep">
        What to change
      </span>
      <span className="text-[13px] leading-relaxed text-ink">{text}</span>
    </div>
  );
}

function Avatar({ persona, tone, small }: { persona: Persona; tone: string; small?: boolean }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-display font-semibold ${tone} ${
        small ? "h-6 w-6 text-[10px]" : "h-10 w-10 text-sm"
      }`}
    >
      {persona.initials}
    </span>
  );
}

// ── By user ──────────────────────────────────────────────────────────

function PersonaCard({
  persona,
  tone,
  screens,
  expanded,
  onToggle,
  onAsk,
  delay,
}: {
  persona: Persona;
  tone: string;
  screens: Map<string, Screen>;
  expanded: boolean;
  onToggle: () => void;
  onAsk: (q: string) => void;
  delay: number;
}) {
  const badge = outcomeBadge(persona);
  return (
    <div
      className="rise overflow-hidden rounded-lg border border-line bg-card shadow-[0_1px_2px_rgba(34,29,20,0.05)]"
      style={{ animationDelay: `${delay}ms` }}
    >
      <button
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-paper sm:gap-4 sm:px-5"
      >
        <Avatar persona={persona} tone={tone} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">
            {persona.name}
            <span className="ml-1.5 text-ink-soft">{persona.age}</span>
          </span>
          <span className="block truncate text-[13px] text-ink-soft">{contextLine(persona)}</span>
        </span>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${badge.cls}`}>
          {badge.label}
        </span>
        <span
          className={`no-print hidden shrink-0 text-ink-soft transition-transform sm:block ${expanded ? "rotate-180" : ""}`}
          aria-hidden
        >
          ▾
        </span>
      </button>

      {expanded && (
        <ol className="border-t border-line px-4 py-4 sm:px-5">
          {persona.steps.map((step, i) => {
            const screen = screens.get(step.screen_id);
            const last = i === persona.steps.length - 1;
            return (
              <li key={step.id} className="print-avoid-break relative flex gap-3 pb-5 last:pb-1 sm:gap-4">
                {!last && (
                  <span className="absolute left-[13px] top-8 h-[calc(100%-2rem)] w-px bg-line" aria-hidden />
                )}
                <span
                  className={`z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold tabular-nums ${STEP_DOT[step.status]}`}
                >
                  {step.position}
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-display text-[11px] font-semibold uppercase tracking-wider text-ink">
                      {screen?.label ?? "Screen"}
                    </span>
                    <MetricTags step={step} persona={persona} />
                  </div>
                  <p className="text-[13.5px] leading-relaxed text-ink-soft">{step.narrative}</p>
                  {step.suggestion && <Suggestion text={step.suggestion} />}
                </div>
              </li>
            );
          })}
          <li className="border-t border-line pt-3">
            <AskChips questions={userQuestions(persona)} onAsk={onAsk} />
          </li>
        </ol>
      )}
    </div>
  );
}

// ── By screen ────────────────────────────────────────────────────────

function ScreenSection({
  screen,
  report,
  tones,
  onAsk,
  delay,
}: {
  screen: Screen;
  report: RunReport;
  tones: Map<string, string>;
  onAsk: (q: string) => void;
  delay: number;
}) {
  const rows = report.personas
    .map((p) => ({ p, step: p.steps.find((s) => s.screen_id === screen.id) }))
    .filter((r): r is { p: Persona; step: Step } => r.step != null);
  const unreached = report.personas.length - rows.length;
  const count = (s: StepStatus) => rows.filter((r) => r.step.status === s).length;
  const segments = [
    { n: count("ok"), cls: "bg-ok/70" },
    { n: count("friction"), cls: "bg-warn/70" },
    { n: count("dropped"), cls: "bg-bad/70" },
    { n: unreached, cls: "bg-line" },
  ].filter((s) => s.n > 0);

  return (
    <section
      className="rise rounded-lg border border-line bg-card p-4 shadow-[0_1px_2px_rgba(34,29,20,0.05)] sm:p-5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <h3 className="font-display text-lg font-semibold">
          <span className="mr-2 text-ink-soft">{screen.position}.</span>
          {screen.label}
        </h3>
        <span className="text-xs text-ink-soft">
          {count("dropped") > 0 && <span className="text-bad">{count("dropped")} left here · </span>}
          {count("friction") > 0 && <span className="text-warn">{count("friction")} struggled · </span>}
          {unreached > 0 ? `${unreached} never reached` : `${rows.length} of ${report.personas.length} saw it`}
        </span>
      </div>
      <div className="mb-4 flex h-1.5 w-full gap-0.5 overflow-hidden rounded-full" aria-hidden>
        {segments.map((s, i) => (
          <span key={i} className={`${s.cls} h-full`} style={{ flexGrow: s.n }} />
        ))}
      </div>
      <ul className="space-y-3">
        {rows.map(({ p, step }) => (
          <li key={step.id} className="flex gap-2.5">
            <Avatar persona={p} tone={tones.get(p.id)!} small />
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] leading-relaxed">
                <span className="mr-1.5 font-medium">{p.name.split(" ")[0]}</span>
                <span
                  className={`mr-1.5 inline-block h-2 w-2 rounded-full align-baseline ${
                    step.status === "ok" ? "bg-ok/70" : step.status === "friction" ? "bg-warn/80" : "bg-bad/80"
                  }`}
                  aria-label={step.status}
                />
                <span className="text-ink-soft">{step.narrative}</span>
              </p>
              {step.suggestion && <Suggestion text={step.suggestion} />}
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-3 border-t border-line pt-3">
        <AskChips questions={screenQuestions(screen)} onAsk={onAsk} />
      </div>
    </section>
  );
}

// ── Root ─────────────────────────────────────────────────────────────

export default function ResultsView({
  report,
  initialView = "user",
}: {
  report: RunReport;
  initialView?: "user" | "screen";
}) {
  const screens = useMemo(() => new Map(report.screens.map((s) => [s.id, s])), [report]);
  const personas = useMemo(
    () =>
      [...report.personas].sort(
        (a, b) =>
          OUTCOME_RANK[a.outcome] - OUTCOME_RANK[b.outcome] ||
          (a.dropped_at_screen ?? 99) - (b.dropped_at_screen ?? 99),
      ),
    [report],
  );
  const tones = useMemo(
    () => new Map(report.personas.map((p, i) => [p.id, AVATAR_TONES[i % AVATAR_TONES.length]])),
    [report],
  );

  const [view, setView] = useState<"user" | "screen">(initialView);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set([personas[0]?.id]));

  // ONE merged conversation per run, persisted to localStorage (ephemeral to
  // this browser, no DB). Each user turn carries its own scope badge.
  const storeKey = `dn-chat-${report.id}`;
  const [chatOpen, setChatOpen] = useState(false);
  const [pending, setPending] = useState<PendingAsk | null>(null);
  const askId = useRef(0);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const v = JSON.parse(localStorage.getItem(storeKey) || "[]");
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(storeKey, JSON.stringify(messages));
    } catch {
      /* quota / private mode — chat just won't persist across reloads */
    }
  }, [storeKey, messages]);

  const askUser = (p: Persona, q: string) => {
    setPending({ id: ++askId.current, question: q, scope: { type: "user", label: `${p.name}, ${p.age}` } });
    setChatOpen(true);
  };
  const askScreen = (s: Screen, q: string) => {
    setPending({ id: ++askId.current, question: q, scope: { type: "screen", label: s.label } });
    setChatOpen(true);
  };

  // Export: PDF via print (expand every card + hide chrome first), and a
  // one-click Markdown download.
  const [printing, setPrinting] = useState(false);
  useEffect(() => {
    if (!printing) return;
    const t = setTimeout(() => {
      window.print();
      setPrinting(false);
    }, 120);
    return () => clearTimeout(t);
  }, [printing]);
  const exportPdf = () => {
    setExpanded(new Set(report.personas.map((p) => p.id)));
    setChatOpen(false);
    setPrinting(true);
  };
  const exportMarkdown = () => {
    const blob = new Blob([reportToMarkdown(report)], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportSlug(report.title)}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const reached = report.personas.filter((p) => p.outcome !== "dropped").length;
  const total = report.personas.length;
  const worstScreen = useMemo(() => {
    const score = (sc: Screen) => {
      const steps = report.personas.flatMap((p) => p.steps.filter((s) => s.screen_id === sc.id));
      return steps.filter((s) => s.status === "dropped").length * 2 + steps.filter((s) => s.status === "friction").length;
    };
    return [...report.screens].sort((a, b) => score(b) - score(a) || a.position - b.position)[0];
  }, [report]);

  const toggleCard = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-24 sm:px-6">
      {/* Report header */}
      <header className="rise pb-6 pt-10 sm:pt-14" style={{ animationDelay: "0ms" }}>
        <p className="mb-2 font-display text-[11px] font-semibold uppercase tracking-[0.18em] text-terra">
          Field report ·{" "}
          {new Date(report.created_at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            timeZone: "UTC",
          })}
        </p>
        <h1 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">{report.title}</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-soft">{report.description}</p>
      </header>

      {/* Summary strip */}
      <div className="rise mb-6 grid grid-cols-3 divide-x divide-line overflow-hidden rounded-lg border border-line bg-card shadow-[0_1px_2px_rgba(34,29,20,0.05)]" style={{ animationDelay: "60ms" }}>
        <div className="min-w-0 px-3 py-4 sm:px-5">
          <p className="font-display text-3xl font-semibold tabular-nums sm:text-4xl">{total}</p>
          <p className="mt-1 text-[11px] text-ink-soft sm:text-xs">users tested</p>
        </div>
        <div className="min-w-0 px-3 py-4 sm:px-5">
          <p className={`font-display text-3xl font-semibold tabular-nums sm:text-4xl ${reached < total / 2 ? "text-bad" : ""}`}>
            {reached}
            <span className="text-lg text-ink-soft sm:text-xl"> of {total}</span>
          </p>
          <p className="mt-1 text-[11px] text-ink-soft sm:text-xs">reached the end</p>
        </div>
        <div className="min-w-0 px-3 py-4 sm:px-5">
          <p className="truncate font-display text-xl font-semibold leading-[1.6rem] sm:text-2xl sm:leading-[2.5rem]">
            {worstScreen?.label}
          </p>
          <p className="mt-1 text-[11px] text-ink-soft sm:text-xs">worst screen</p>
        </div>
      </div>

      {/* Toggle + export */}
      <div className="rise no-print mb-4 flex flex-wrap items-center justify-between gap-2" style={{ animationDelay: "120ms" }}>
        <div className="inline-flex rounded-full border border-line bg-card p-0.5" role="tablist">
          {(["user", "screen"] as const).map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                view === v ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"
              }`}
            >
              {v === "user" ? "By user" : "By screen"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportPdf}
            className="rounded-full border border-line bg-card px-3 py-1.5 text-[13px] font-medium text-ink transition-colors hover:border-ink-soft"
          >
            ↓ PDF
          </button>
          <button
            onClick={exportMarkdown}
            className="rounded-full border border-line bg-card px-3 py-1.5 text-[13px] font-medium text-ink transition-colors hover:border-ink-soft"
          >
            ↓ Markdown
          </button>
          <button
            onClick={() => setChatOpen(true)}
            className="rounded-full border border-line bg-card px-3 py-1.5 text-[13px] font-medium text-ink transition-colors hover:border-ink-soft"
          >
            Ask AI ✦
          </button>
        </div>
      </div>

      {view === "user" ? (
        <div className="space-y-3">
          {personas.map((p, i) => (
            <PersonaCard
              key={p.id}
              persona={p}
              tone={tones.get(p.id)!}
              screens={screens}
              expanded={expanded.has(p.id)}
              onToggle={() => toggleCard(p.id)}
              onAsk={(q) => askUser(p, q)}
              delay={160 + i * 60}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {report.screens.map((s, i) => (
            <ScreenSection
              key={s.id}
              screen={s}
              report={report}
              tones={tones}
              onAsk={(q) => askScreen(s, q)}
              delay={i * 60}
            />
          ))}
        </div>
      )}

      {chatOpen && (
        <ChatDrawer
          runId={report.id}
          messages={messages}
          setMessages={setMessages}
          pending={pending}
          onPendingHandled={() => setPending(null)}
          suggestions={CHAT_STARTERS.map((s) => s.prompt)}
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  );
}
