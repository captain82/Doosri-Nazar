import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getProvider, PERSONA_MODEL } from "@/lib/ai";
import type { ChatTurn } from "@/lib/ai/types";
import { CHAT_SYSTEM, reportContext } from "@/lib/prompts";
import { fetchRunReport } from "@/lib/queries";
import { FAKE_REPORT } from "@/lib/fake-run";
import type { RunReport } from "@/lib/types";

export const maxDuration = 60;

interface Scope {
  type: "user" | "screen" | "flow";
  label: string;
}

function focusNote(scope?: Scope): string {
  if (!scope || scope.type === "flow") return "";
  if (scope.type === "user") {
    return `The designer is focused on the user "${scope.label}". Centre your answers on this specific person and their walkthrough; reference other users only for comparison.`;
  }
  return `The designer is focused on the screen "${scope.label}". Centre your answers on what happened on this screen across the different users.`;
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  let body: { messages?: ChatTurn[]; scope?: Scope };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  const messages = (body.messages ?? [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.text === "string" && m.text.trim())
    .slice(-20);
  if (!messages.length) return NextResponse.json({ error: "No message." }, { status: 400 });

  // The demo report is public; real runs require auth and RLS ownership.
  let report: RunReport | null;
  if (params.id === "demo") {
    report = FAKE_REPORT;
  } else {
    const supabase = supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
    report = await fetchRunReport(supabase, params.id);
  }
  if (!report) return NextResponse.json({ error: "Run not found." }, { status: 404 });

  const focus = focusNote(body.scope);
  const system = `${CHAT_SYSTEM}${focus ? `\n\n${focus}` : ""}\n\n=== THE REPORT ===\n${reportContext(report)}`;
  const provider = getProvider();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of provider.streamText({ model: PERSONA_MODEL, system, messages })) {
          controller.enqueue(encoder.encode(chunk));
        }
      } catch {
        controller.enqueue(encoder.encode("\n\n[Sorry — something went wrong answering that. Try again.]"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
