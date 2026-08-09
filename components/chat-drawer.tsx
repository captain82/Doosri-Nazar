"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatTurn } from "@/lib/ai/types";

export interface ChatScope {
  type: "user" | "screen" | "flow";
  label: string;
}

export default function ChatDrawer({
  runId,
  scope,
  seed,
  suggestions,
  onClose,
}: {
  runId: string;
  scope: ChatScope;
  seed?: string;
  suggestions: string[];
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const seeded = useRef(false);

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || streaming) return;
    setInput("");
    const history: ChatTurn[] = [...messages, { role: "user", text: question }];
    setMessages([...history, { role: "assistant", text: "" }]);
    setStreaming(true);
    try {
      const res = await fetch(`/api/runs/${runId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, scope }),
      });
      if (!res.ok || !res.body) throw new Error();
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", text: acc };
          return next;
        });
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
      }
      if (!acc) {
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", text: "Sorry — I couldn't answer that. Try again." };
          return next;
        });
      }
    } catch {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: "assistant", text: "Couldn't reach the server. Try again." };
        return next;
      });
    } finally {
      setStreaming(false);
    }
  };

  // Auto-send the tapped question when the drawer opens with a seed.
  useEffect(() => {
    if (seed && !seeded.current) {
      seeded.current = true;
      send(seed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  // Esc to close.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const scopeKind =
    scope.type === "user" ? "User" : scope.type === "screen" ? "Screen" : "Report";

  return (
    <>
      {/* Backdrop — dim on mobile, subtle on desktop so the report stays visible */}
      <div
        className="fixed inset-0 z-40 bg-ink/30 sm:bg-ink/10"
        onClick={onClose}
        aria-hidden
      />
      <aside className="rise fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-line bg-paper shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <p className="font-display text-[11px] font-semibold uppercase tracking-[0.18em] text-terra">
              Ask about this {scopeKind.toLowerCase()}
            </p>
            <p className="mt-0.5 truncate font-display text-lg font-semibold">{scope.label}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-full border border-line px-2 py-0.5 text-ink-soft transition-colors hover:border-ink-soft hover:text-ink"
          >
            ✕
          </button>
        </header>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {messages.length === 0 && (
            <p className="text-[13.5px] text-ink-soft">
              Grounded in this {scopeKind.toLowerCase()}&apos;s findings. Pick a question or type your own.
            </p>
          )}
          {messages.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="flex justify-end">
                <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-ink px-3.5 py-2 text-[14px] text-paper">
                  {m.text}
                </p>
              </div>
            ) : (
              <div key={i} className="flex justify-start">
                <div className="max-w-[92%] whitespace-pre-wrap text-[14px] leading-relaxed text-ink">
                  {m.text || (
                    <span className="inline-flex gap-1" aria-label="thinking">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-soft [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-soft [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-soft" />
                    </span>
                  )}
                </div>
              </div>
            ),
          )}
        </div>

        {/* Suggested follow-ups */}
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 border-t border-line px-5 pt-3">
            {suggestions.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                disabled={streaming}
                className="rounded-full border border-line bg-card px-2.5 py-1 text-[12px] text-ink transition-colors hover:border-ink-soft disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex gap-2 px-5 py-4"
        >
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything…"
            className="flex-1 rounded-full border border-line bg-card px-4 py-2.5 text-[14px] outline-none transition-colors placeholder:text-ink-soft/60 focus:border-ink-soft"
          />
          <button
            type="submit"
            disabled={streaming || !input.trim()}
            className="rounded-full bg-ink px-4 py-2.5 text-[14px] font-medium text-paper transition-colors hover:bg-terra-deep disabled:opacity-40"
          >
            {streaming ? "…" : "Ask"}
          </button>
        </form>
      </aside>
    </>
  );
}
