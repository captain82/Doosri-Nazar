import { NextResponse } from "next/server";
import { fetchRunReport } from "@/lib/queries";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const report = await fetchRunReport(supabase, params.id);
  if (!report) return NextResponse.json({ error: "Run not found." }, { status: 404 });

  return NextResponse.json(report);
}
