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
          className="rounded-full border border-black/5 bg-white/70 px-2.5 py-1 text-[12px] text-ink transition-colors hover:border-ink-soft"
        >
          {q}
        </button>
      ))}
    </div>
  );
}

// Soft pastel tints, a rotating, colourful set, kept quiet and low-contrast
// so the cards read as calm coloured fills rather than loud blocks.
const CARD_TINTS = [
  { bg: "bg-[#F1F4E9]", border: "border-[#E3E8D2]", line: "border-[#DCE3C6]" }, // green
  { bg: "bg-[#F4EFF5]", border: "border-[#E8DEEA]", line: "border-[#E0D2E3]" }, // lilac
  { bg: "bg-[#FAF4E4]", border: "border-[#EEE3C8]", line: "border-[#E9DBB8]" }, // butter
  { bg: "bg-[#FAEFE9]", border: "border-[#EFDFD5]", line: "border-[#EDD5C8]" }, // blush
  { bg: "bg-[#EEF2F7]", border: "border-[#DFE6EF]", line: "border-[#D6E0EB]" }, // sky
];

// The single most telling step for a persona, where they quit, else the
// first friction, else their last step, used as the card's headline moment.
function keyStep(p: Persona): Step | undefined {
  return (
    p.steps.find((s) => s.status === "dropped") ??
    p.steps.find((s) => s.status === "friction") ??
    p.steps[p.steps.length - 1]
  );
}

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
    <div className="mt-2 rounded-lg bg-terra-tint/60 px-3 py-2">
      <span className="mr-1.5 font-display text-[10px] font-semibold uppercase tracking-wider text-terra-deep">
        Fix
      </span>
      <span className="text-[12px] leading-relaxed text-ink/80">{text}</span>
    </div>
  );
}

// ── By user ──────────────────────────────────────────────────────────

const OUTCOME_DOT: Record<Persona["outcome"], string> = {
  dropped: "bg-bad",
  struggled: "bg-warn",
  completed: "bg-ok",
};

function PersonaCard({
  persona,
  tint,
  screens,
  expanded,
  onToggle,
  onAsk,
  delay,
}: {
  persona: Persona;
  tint: (typeof CARD_TINTS)[number];
  screens: Map<string, Screen>;
  expanded: boolean;
  onToggle: () => void;
  onAsk: (q: string) => void;
  delay: number;
}) {
  const badge = outcomeBadge(persona);
  const key = keyStep(persona);
  const keyScreen = key ? screens.get(key.screen_id) : undefined;
  const reached = persona.steps.filter((s) => s.status !== "dropped").length;

  return (
    <div
      className={`rise print-avoid-break flex flex-col overflow-hidden rounded-2xl border ${tint.border} ${tint.bg} ${
        expanded ? "sm:col-span-2" : ""
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <button onClick={onToggle} aria-expanded={expanded} className="flex-1 p-5 text-left sm:p-6">
        {/* Header: name + quiet outcome */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-[16px] font-semibold leading-snug text-ink">
              {persona.name} <span className="font-normal text-ink/40">{persona.age}</span>
            </h3>
            <p className="mt-1 text-[11.5px] text-ink/50">
              {persona.language} · {persona.connection}
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap pt-0.5 text-[11px] font-medium text-ink/55">
            <span className={`h-1.5 w-1.5 rounded-full ${OUTCOME_DOT[persona.outcome]}`} />
            {badge.label}
          </span>
        </div>

        {/* Key moment, hidden when expanded, since the full walkthrough shows below */}
        {key && !expanded && (
          <div className="mt-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-ink/40">
              {persona.outcome === "dropped" ? "Where they quit" : "Sticking point"}
              {keyScreen ? ` · ${keyScreen.label}` : ""}
            </p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink/70 line-clamp-3">{key.narrative}</p>
          </div>
        )}

        {/* Footer */}
        <div className={`mt-5 flex items-center border-t ${tint.line} pt-3 text-[11px] text-ink/45`}>
          <span className="tabular-nums">
            {reached}/{persona.steps.length} screens
          </span>
          <span className="no-print ml-auto font-medium text-ink/55">
            {expanded ? "Hide walkthrough ▴" : "Walkthrough ▾"}
          </span>
        </div>
      </button>

      {expanded && (
        <ol className="border-t border-white/60 bg-white/40 px-5 py-4 sm:px-6">
          {persona.steps.map((step, i) => {
            const screen = screens.get(step.screen_id);
            const last = i === persona.steps.length - 1;
            return (
              <li key={step.id} className="print-avoid-break relative flex gap-3 pb-5 last:pb-1">
                {!last && (
                  <span className="absolute left-3 top-7 h-[calc(100%-1.75rem)] w-px bg-ink/10" aria-hidden />
                )}
                <span
                  className={`z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold tabular-nums ${STEP_DOT[step.status]}`}
                >
                  {step.position}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-display text-[10.5px] font-semibold uppercase tracking-wider text-ink">
                      {screen?.label ?? "Screen"}
                    </span>
                    <MetricTags step={step} persona={persona} />
                  </div>
                  <p className="text-[12.5px] leading-relaxed text-ink-soft">{step.narrative}</p>
                  {step.suggestion && <Suggestion text={step.suggestion} />}
                </div>
              </li>
            );
          })}
          <li className="border-t border-ink/10 pt-3">
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
  tint,
  onAsk,
  delay,
}: {
  screen: Screen;
  report: RunReport;
  tint: (typeof CARD_TINTS)[number];
  onAsk: (q: string) => void;
  delay: number;
}) {
  const rows = report.personas
    .map((p) => ({ p, step: p.steps.find((s) => s.screen_id === screen.id) }))
    .filter((r): r is { p: Persona; step: Step } => r.step != null);
  const unreached = report.personas.length - rows.length;
  const count = (s: StepStatus) => rows.filter((r) => r.step.status === s).length;
  const segments = [
    { n: count("ok"), cls: "bg-ok/80" },
    { n: count("friction"), cls: "bg-warn/90" },
    { n: count("dropped"), cls: "bg-bad/90" },
    { n: unreached, cls: "bg-ink/15" },
  ].filter((s) => s.n > 0);

  return (
    <section
      className={`rise print-avoid-break rounded-2xl border ${tint.border} ${tint.bg} p-5 sm:p-6`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="font-display text-[16px] font-semibold text-ink">
          <span className="mr-2 text-ink/35">{screen.position}.</span>
          {screen.label}
        </h3>
        <span className="shrink-0 text-[11px] text-ink/50">
          {count("dropped") > 0 && <span className="font-medium text-bad">{count("dropped")} left · </span>}
          {count("friction") > 0 && <span className="font-medium text-warn">{count("friction")} struggled · </span>}
          {unreached > 0 ? `${unreached} never reached` : `${rows.length}/${report.personas.length} saw it`}
        </span>
      </div>
      <div className="mb-4 flex h-1 w-full gap-0.5 overflow-hidden rounded-full bg-white/60" aria-hidden>
        {segments.map((s, i) => (
          <span key={i} className={`${s.cls} h-full`} style={{ flexGrow: s.n }} />
        ))}
      </div>
      <ul className="space-y-1.5">
        {rows.map(({ p, step }) => (
          <li key={step.id} className="rounded-xl bg-white/40 px-3.5 py-2.5">
            <p className="text-[12.5px] leading-relaxed">
              <span
                className={`mr-2 inline-block h-1.5 w-1.5 rounded-full align-middle ${
                  step.status === "ok" ? "bg-ok/80" : step.status === "friction" ? "bg-warn/90" : "bg-bad/90"
                }`}
                aria-label={step.status}
              />
              <span className="mr-1.5 font-medium text-ink">{p.name.split(" ")[0]}</span>
              <span className="text-ink/65">{step.narrative}</span>
            </p>
            {step.suggestion && <Suggestion text={step.suggestion} />}
          </li>
        ))}
      </ul>
      <div className={`mt-4 border-t ${tint.line} pt-3`}>
        <AskChips questions={screenQuestions(screen)} onAsk={onAsk} />
      </div>
    </section>
  );
}

// ── Summary-strip icons ──────────────────────────────────────────────
function IconUsers({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
      <path d="M16 5.2a3 3 0 0 1 0 5.6M18.5 20c0-2.6-1-4.4-2.6-5.4" />
    </svg>
  );
}
function IconFlag({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 21V4" />
      <path d="M5 4h11l-2 3 2 3H5" />
    </svg>
  );
}
function IconAlert({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 4 2.5 20h19L12 4Z" />
      <path d="M12 10.5v4" />
      <circle cx="12" cy="17.4" r="0.5" fill="currentColor" stroke="none" />
    </svg>
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

  const [view, setView] = useState<"user" | "screen">(initialView);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

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
      /* quota / private mode, chat just won't persist across reloads */
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
  const [exportOpen, setExportOpen] = useState(false);
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
        <h1 className="font-display text-[26px] font-semibold leading-tight sm:text-[32px]">{report.title}</h1>
        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-ink-soft">{report.description}</p>
      </header>

      {/* Summary strip */}
      <div className="rise mb-6 grid grid-cols-3 gap-2.5 sm:gap-4" style={{ animationDelay: "60ms" }}>
        {/* Users tested */}
        <div className="flex min-w-0 flex-col rounded-2xl border border-[#C6D2E0] bg-[#E5EBF2] p-3.5 sm:p-5">
          <div className="flex items-center gap-1.5 text-[#3B5273]">
            <IconUsers className="hidden h-4 w-4 sm:block" />
            <span className="text-[10px] font-semibold uppercase tracking-wider sm:text-[11px]">Users tested</span>
          </div>
          <p className="mt-auto pt-3 font-display text-3xl font-semibold tabular-nums leading-none text-ink sm:text-[2.6rem]">
            {total}
          </p>
        </div>

        {/* Reached the end */}
        <div
          className={`flex min-w-0 flex-col rounded-2xl border p-3.5 sm:p-5 ${
            reached < total / 2 ? "border-[#EAC7B7] bg-[#F8E6DD]" : "border-[#CFDCAF] bg-[#EDF1DE]"
          }`}
        >
          <div className={`flex items-center gap-1.5 ${reached < total / 2 ? "text-bad" : "text-ok"}`}>
            <IconFlag className="hidden h-4 w-4 sm:block" />
            <span className="text-[10px] font-semibold uppercase tracking-wider sm:text-[11px]">Reached the end</span>
          </div>
          <div className="mt-auto pt-3">
            <p className="font-display text-3xl font-semibold tabular-nums leading-none text-ink sm:text-[2.6rem]">
              {reached}
              <span className="text-lg text-ink/45 sm:text-2xl"> of {total}</span>
            </p>
            <div className="mt-2.5 flex gap-1" aria-hidden>
              {Array.from({ length: total }).map((_, i) => (
                <span key={i} className={`h-1.5 flex-1 rounded-full ${i < reached ? "bg-ok/70" : "bg-ink/12"}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Worst screen */}
        <div className="flex min-w-0 flex-col rounded-2xl border border-[#E7D6A4] bg-[#F8EFD7] p-3.5 sm:p-5">
          <div className="flex items-center gap-1.5 text-warn">
            <IconAlert className="hidden h-4 w-4 sm:block" />
            <span className="text-[10px] font-semibold uppercase tracking-wider sm:text-[11px]">Worst screen</span>
          </div>
          <p className="mt-auto truncate pt-3 font-display text-xl font-semibold leading-tight text-ink sm:text-[1.75rem]">
            {worstScreen?.label}
          </p>
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
          <div className="relative">
            <button
              onClick={() => setExportOpen((v) => !v)}
              aria-expanded={exportOpen}
              className="rounded-full border border-line bg-card px-3 py-1.5 text-[13px] font-medium text-ink transition-colors hover:border-ink-soft"
            >
              Export report ↓
            </button>
            {exportOpen && (
              <>
                <button
                  aria-hidden
                  onClick={() => setExportOpen(false)}
                  className="fixed inset-0 z-40 cursor-default"
                />
                <div className="absolute right-0 z-50 mt-1 w-48 overflow-hidden rounded-lg border border-line bg-card shadow-lg">
                  <button
                    onClick={() => {
                      setExportOpen(false);
                      exportPdf();
                    }}
                    className="block w-full px-3.5 py-2.5 text-left text-[13px] transition-colors hover:bg-paper"
                  >
                    <span className="font-medium">PDF</span>
                    <span className="text-ink-soft"> · print / save</span>
                  </button>
                  <button
                    onClick={() => {
                      setExportOpen(false);
                      exportMarkdown();
                    }}
                    className="block w-full border-t border-line px-3.5 py-2.5 text-left text-[13px] transition-colors hover:bg-paper"
                  >
                    <span className="font-medium">Markdown</span>
                    <span className="text-ink-soft"> · .md file</span>
                  </button>
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => setChatOpen(true)}
            className="rounded-full border border-line bg-card px-3 py-1.5 text-[13px] font-medium text-ink transition-colors hover:border-ink-soft"
          >
            Ask AI ✦
          </button>
        </div>
      </div>

      {view === "user" ? (
        <div className="report-grid grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
          {personas.map((p, i) => (
            <PersonaCard
              key={p.id}
              persona={p}
              tint={CARD_TINTS[i % CARD_TINTS.length]}
              screens={screens}
              expanded={expanded.has(p.id)}
              onToggle={() => toggleCard(p.id)}
              onAsk={(q) => askUser(p, q)}
              delay={160 + i * 60}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {report.screens.map((s, i) => (
            <ScreenSection
              key={s.id}
              screen={s}
              report={report}
              tint={CARD_TINTS[i % CARD_TINTS.length]}
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
