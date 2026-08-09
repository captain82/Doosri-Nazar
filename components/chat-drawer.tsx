"use client";

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { ChatTurn } from "@/lib/ai/types";

export interface MsgScope {
  type: "user" | "screen";
  label: string;
}

// A single merged conversation. Each user turn may carry a scope badge
// (which user or screen it was about); the model is focused inline per turn.
export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  scope?: MsgScope;
}

export interface PendingAsk {
  id: number;
  question: string;
  scope?: MsgScope;
}

export default function ChatDrawer({
  runId,
  messages,
  setMessages,
  pending,
  onPendingHandled,
  suggestions,
  onClose,
}: {
  runId: string;
  messages: ChatMessage[];
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  pending: PendingAsk | null;
  onPendingHandled: () => void;
  suggestions: string[];
  onClose: () => void;
}) {
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const streamingRef = useRef(false);
  const handledPending = useRef(0);

  const send = async (text: string, scope?: MsgScope) => {
    const q = text.trim();
    if (!q || streamingRef.current) return;
    setInput("");
    streamingRef.current = true;
    setStreaming(true);

    const userMsg: ChatMessage = { role: "user", text: q, scope };
    const history = [...messages, userMsg];
    setMessages([...history, { role: "assistant", text: "" }]);

    // Focus the model on this turn's scope inline, so a single thread can
    // mix user/screen/report questions and still stay grounded per message.
    const apiMessages: ChatTurn[] = history.map((m) => ({
      role: m.role,
      text:
        m.role === "user" && m.scope
          ? `[The designer is asking specifically about the ${m.scope.type} "${m.scope.label}". Centre this answer on it.] ${m.text}`
          : m.text,
    }));

    try {
      const res = await fetch(`/api/runs/${runId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
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
      streamingRef.current = false;
      setStreaming(false);
    }
  };

  // A tapped card/screen question arrives as a "pending" ask — send it once,
  // then clear it so reopening the drawer doesn't re-ask.
  useEffect(() => {
    if (pending && pending.id !== handledPending.current) {
      handledPending.current = pending.id;
      send(pending.question, pending.scope);
      onPendingHandled();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  // Start scrolled to the latest when reopening a long thread.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-ink/30 sm:bg-ink/10" onClick={onClose} aria-hidden />
      <aside className="rise fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-line bg-paper shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <p className="font-display text-[11px] font-semibold uppercase tracking-[0.18em] text-terra">
              Ask about this report
            </p>
            <p className="mt-0.5 text-[13px] text-ink-soft">
              One conversation — tap a question on any user or screen, or type your own.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {messages.length > 0 && !streaming && (
              <button
                onClick={() => setMessages([])}
                className="text-[12px] text-ink-soft transition-colors hover:text-ink"
              >
                Clear
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close"
              className="rounded-full border border-line px-2 py-0.5 text-ink-soft transition-colors hover:border-ink-soft hover:text-ink"
            >
              ✕
            </button>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {messages.length === 0 && (
            <div className="space-y-3">
              <p className="text-[13.5px] text-ink-soft">
                Grounded in this report. Try one of these, or ask anything.
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="rounded-full border border-line bg-card px-2.5 py-1 text-[12px] text-ink transition-colors hover:border-ink-soft"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="flex flex-col items-end gap-1">
                {m.scope && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      m.scope.type === "user"
                        ? "bg-terra-tint text-terra-deep"
                        : "bg-[#E4E9F0] text-[#3B5273]"
                    }`}
                  >
                    {m.scope.type === "user" ? "User" : "Screen"} · {m.scope.label}
                  </span>
                )}
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

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex gap-2 border-t border-line px-5 py-4"
        >
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about these findings…"
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
