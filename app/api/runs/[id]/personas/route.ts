import { NextResponse } from "next/server";
import type { TextBlockParam } from "@anthropic-ai/sdk/resources/messages";
import { supabaseServer } from "@/lib/supabase/server";
import { MODEL_PERSONA } from "@/lib/anthropic";
import { PERSONA_SYSTEM, PERSONA_SCHEMA, personaUserText } from "@/lib/prompts";
import { imageBlock, jsonCall } from "@/lib/walk";

export const maxDuration = 300;

interface GeneratedPersona {
  name: string;
  age: number;
  language: string;
  device: string;
  connection: "5G" | "4G" | "Weak 4G" | "Throttled";
  context: string;
  initials: string;
}

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const { data: run } = await supabase
    .from("runs")
    .select("id, description")
    .eq("id", params.id)
    .single();
  if (!run) return NextResponse.json({ error: "Run not found." }, { status: 404 });

  const { data: screens } = await supabase
    .from("screens")
    .select("storage_path, position")
    .eq("run_id", run.id)
    .order("position", { ascending: true });
  if (!screens?.length) {
    return NextResponse.json({ error: "This run has no screens." }, { status: 400 });
  }

  await supabase.from("runs").update({ status: "generating" }).eq("id", run.id);

  try {
    const t0 = Date.now();
    const first = await imageBlock(supabase, new Map(), screens[0].storage_path);
    console.log(`[personas] image ready in ${Date.now() - t0}ms`);
    const system: TextBlockParam[] = [
      { type: "text", text: PERSONA_SYSTEM, cache_control: { type: "ephemeral" } },
    ];

    const tModel = Date.now();
    const { personas } = await jsonCall<{ personas: GeneratedPersona[] }>({
      model: MODEL_PERSONA,
      system,
      schema: PERSONA_SCHEMA,
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: personaUserText(run.description) }, first],
        },
      ],
    });

    console.log(`[personas] model returned ${personas?.length} in ${Date.now() - tModel}ms`);

    const rows = personas.slice(0, 5).map((p) => ({
      run_id: run.id,
      name: p.name,
      age: p.age,
      language: p.language,
      device: p.device,
      connection: p.connection,
      context: p.context,
      initials: p.initials || p.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
    }));

    const { data: inserted, error } = await supabase.from("personas").insert(rows).select("*");
    if (error) throw new Error(error.message);

    await supabase.from("runs").update({ status: "walking" }).eq("id", run.id);
    return NextResponse.json({ personas: inserted });
  } catch (err) {
    await supabase.from("runs").update({ status: "error" }).eq("id", run.id);
    const message = err instanceof Error ? err.message : "Persona generation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
