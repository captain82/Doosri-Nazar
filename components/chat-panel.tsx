"use client";

import { useRef, useState } from "react";
import { CHAT_STARTERS } from "@/lib/prompts";
import type { ChatTurn } from "@/lib/ai/types";

export default function ChatPanel({ runId }: { runId: string }) {
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || streaming) return;
    setInput("");
    const history: ChatTurn[] = [...messages, { role: "user", text: question }];
    // Optimistically show the question + an empty assistant bubble to fill.
    setMessages([...history, { role: "assistant", text: "" }]);
    setStreaming(true);

    try {
      const res = await fetch(`/api/runs/${runId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      if (!res.ok || !res.body) {
        throw new Error();
      }
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

  return (
    <section className="mt-10 border-t border-line pt-8">
      <h2 className="font-display text-lg font-semibold">Ask about this report</h2>
      <p className="mt-1 text-[13.5px] text-ink-soft">
        Grounded in the findings above — prioritise fixes, understand a drop-off, or draft tickets.
      </p>

      {/* Starters */}
      <div className="mt-4 flex flex-wrap gap-2">
        {CHAT_STARTERS.map((s) => (
          <button
            key={s.label}
            onClick={() => send(s.prompt)}
            disabled={streaming}
            className="rounded-full border border-line bg-card px-3 py-1.5 text-[13px] text-ink transition-colors hover:border-ink-soft disabled:opacity-50"
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Conversation */}
      {messages.length > 0 && (
        <div
          ref={scrollRef}
          className="mt-5 max-h-[28rem] space-y-4 overflow-y-auto rounded-lg border border-line bg-card p-4 sm:p-5"
        >
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
      )}

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mt-4 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about these findings…"
          className="flex-1 rounded-full border border-line bg-card px-4 py-2.5 text-[14px] outline-none transition-colors placeholder:text-ink-soft/60 focus:border-ink-soft"
        />
        <button
          type="submit"
          disabled={streaming || !input.trim()}
          className="rounded-full bg-ink px-5 py-2.5 text-[14px] font-medium text-paper transition-colors hover:bg-terra-deep disabled:opacity-40"
        >
          {streaming ? "…" : "Ask"}
        </button>
      </form>
    </section>
  );
}
