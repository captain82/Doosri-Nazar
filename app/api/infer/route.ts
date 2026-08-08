import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getProvider, PERSONA_MODEL } from "@/lib/ai";
import { imageFromBuffer } from "@/lib/media";
import { INFER_SYSTEM, INFER_SCHEMA, INFER_USER } from "@/lib/prompts";

export const maxDuration = 60;

// Reads the first screenshot and infers a title, category, and draft
// description so the new-run form arrives prefilled. Best-effort: the form
// works fine if this fails.
export async function POST(request: Request) {
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const form = await request.formData();
  const file = form.get("screen");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No screen provided." }, { status: 400 });
  }

  try {
    const image = await imageFromBuffer(Buffer.from(await file.arrayBuffer()));
    const result = await getProvider().generateJSON<{
      title: string;
      category: string;
      description: string;
    }>({
      model: PERSONA_MODEL,
      system: INFER_SYSTEM,
      schemaName: "flow",
      schema: INFER_SCHEMA,
      messages: [
        { role: "user", content: [{ type: "text", text: INFER_USER }, { type: "image", image }] },
      ],
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not read the screen.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
