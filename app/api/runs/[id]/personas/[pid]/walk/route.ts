import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getProvider, WALK_MODEL } from "@/lib/ai";
import type { AiMessage } from "@/lib/ai/types";
import { imageData, loadSeconds } from "@/lib/media";
import { WALK_SYSTEM, STEP_SCHEMA, walkPersonaHeader, walkScreenText } from "@/lib/prompts";
import type { StepStatus } from "@/lib/types";

export const maxDuration = 300;

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

  // Stable segment first (shared across all personas, cacheable), volatile
  // persona header second.
  const system = [WALK_SYSTEM, walkPersonaHeader(persona)];

  const imageCache = new Map<string, string>();
  const messages: AiMessage[] = [];
  const steps = [];
  let outcome: "completed" | "struggled" | "dropped" = "completed";
  let droppedAt: number | null = null;
  let sawFriction = false;
  const provider = getProvider();

  try {
    for (const screen of screens) {
      const secs = loadSeconds(screen.bytes, persona.connection);
      const img = await imageData(supabase, imageCache, screen.storage_path);

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
          { type: "image", image: img },
        ],
      });

      const step = await provider.generateJSON<StepResult>({
        model: WALK_MODEL,
        system,
        schemaName: "step",
        schema: STEP_SCHEMA,
        messages,
      });

      // carry forward what the persona did, so confusion accumulates
      messages.push({ role: "assistant", content: [{ type: "text", text: JSON.stringify(step) }] });

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
