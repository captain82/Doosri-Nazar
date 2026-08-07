import { NextResponse } from "next/server";

// Becomes the real create-run endpoint once Supabase is connected:
// create run row, upload screens to storage, record bytes + dimensions
// server-side, return { runId }.
export async function POST() {
  return NextResponse.json(
    {
      error:
        "The pipeline isn't connected yet — Supabase and the model land next. Meanwhile, the sample report shows what you'll get.",
    },
    { status: 501 },
  );
}
