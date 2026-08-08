import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getProvider, PERSONA_MODEL } from "@/lib/ai";
import { imageFromBuffer } from "@/lib/media";
import type { AiPart } from "@/lib/ai/types";
import { INFER_SYSTEM, INFER_SCHEMA, INFER_USER } from "@/lib/prompts";

export const maxDuration = 60;

// Read up to this many screens for the flow read-back — enough to understand
// the flow without an unbounded token cost.
const MAX_SCREENS = 6;

// Reads the uploaded screens and infers a title, category, and draft
// description so the new-run form arrives prefilled. Best-effort: the form
// works fine if this fails.
export async function POST(request: Request) {
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const form = await request.formData();
  const files = form.getAll("screens").filter((f): f is File => f instanceof File).slice(0, MAX_SCREENS);
  if (!files.length) {
    return NextResponse.json({ error: "No screens provided." }, { status: 400 });
  }

  try {
    const images = await Promise.all(
      files.map(async (f) => imageFromBuffer(Buffer.from(await f.arrayBuffer()))),
    );
    const content: AiPart[] = [
      { type: "text", text: INFER_USER },
      ...images.map((image) => ({ type: "image" as const, image })),
    ];
    const result = await getProvider().generateJSON<{
      title: string;
      category: string;
      description: string;
    }>({
      model: PERSONA_MODEL,
      system: INFER_SYSTEM,
      schemaName: "flow",
      schema: INFER_SCHEMA,
      messages: [{ role: "user", content }],
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not read the screens.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
