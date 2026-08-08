import { NextResponse } from "next/server";
import type { MessageParam, TextBlockParam } from "@anthropic-ai/sdk/resources/messages";
import { supabaseServer } from "@/lib/supabase/server";
import { loadSeconds } from "@/lib/anthropic";
import { WALK_SYSTEM, STEP_SCHEMA, walkPersonaHeader, walkScreenText } from "@/lib/prompts";
import { imageBlock, jsonCall } from "@/lib/walk";
import type { StepStatus } from "@/lib/types";

export const maxDuration = 120;

interface StepResult {
  status: StepStatus;
  narrative: string;
  suggestion: string | null;
  continues: boolean;
}

export async function POST(
  _request: Request,
  { params }: { params: { id: string; pid: string } },
) {
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const { data: persona } = await supabase
    .from("personas")
    .select("*")
    .eq("id", params.pid)
    .eq("run_id", params.id)
    .single();
  if (!persona) return NextResponse.json({ error: "Persona not found." }, { status: 404 });

  const { data: screens } = await supabase
    .from("screens")
    .select("id, position, label, storage_path, bytes")
    .eq("run_id", params.id)
    .order("position", { ascending: true });
  if (!screens?.length) return NextResponse.json({ error: "No screens." }, { status: 400 });

  const system: TextBlockParam[] = [
    { type: "text", text: WALK_SYSTEM, cache_control: { type: "ephemeral" } },
    { type: "text", text: walkPersonaHeader(persona), cache_control: { type: "ephemeral" } },
  ];

  const imageCache = new Map<string, string>();
  const messages: MessageParam[] = [];
  const steps = [];
  let outcome: "completed" | "struggled" | "dropped" = "completed";
  let droppedAt: number | null = null;
  let sawFriction = false;
  // The API caps cache_control at 4 breakpoints; system uses 2. So we keep a
  // SINGLE moving breakpoint on the most-recent image — its prefix (all prior
  // screens, already written to cache) is read, and it writes the new screen.
  let prevImage: { cache_control?: unknown } | null = null;

  try {
    for (const screen of screens) {
      const secs = loadSeconds(screen.bytes, persona.connection);
      const img = await imageBlock(supabase, imageCache, screen.storage_path);
      if (prevImage) delete prevImage.cache_control;
      const cachedImg = { ...img, cache_control: { type: "ephemeral" as const } };
      prevImage = cachedImg;

      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: walkScreenText({
              position: screen.position,
              total: screens.length,
              label: screen.label,
              loadSeconds: secs,
              connection: persona.connection,
            }),
          },
          cachedImg,
        ],
      });

      const step = await jsonCall<StepResult>({ system, messages, schema: STEP_SCHEMA });

      // carry forward what the persona did, so confusion accumulates
      messages.push({ role: "assistant", content: JSON.stringify(step) });

      const { data: row } = await supabase
        .from("steps")
        .insert({
          persona_id: persona.id,
          screen_id: screen.id,
          position: screen.position,
          status: step.status,
          narrative: step.narrative,
          suggestion: step.status === "ok" ? null : step.suggestion,
          metrics: { load_seconds: secs },
        })
        .select("*")
        .single();
      if (row) steps.push(row);

      if (step.status === "friction") sawFriction = true;
      if (step.status === "dropped" || !step.continues) {
        outcome = "dropped";
        droppedAt = screen.position;
        break;
      }
    }

    if (outcome !== "dropped") outcome = sawFriction ? "struggled" : "completed";

    const { data: updated } = await supabase
      .from("personas")
      .update({ outcome, dropped_at_screen: droppedAt })
      .eq("id", persona.id)
      .select("*")
      .single();

    return NextResponse.json({ persona: { ...updated, steps } });
  } catch (err) {
    await supabase
      .from("personas")
      .update({ outcome: "struggled", dropped_at_screen: droppedAt })
      .eq("id", persona.id);
    const message = err instanceof Error ? err.message : "Walkthrough failed.";
    return NextResponse.json({ error: message, persona: { ...persona, steps } }, { status: 500 });
  }
}
