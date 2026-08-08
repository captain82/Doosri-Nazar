import { NextResponse } from "next/server";
import { imageSize } from "image-size";
import { supabaseServer } from "@/lib/supabase/server";

export const maxDuration = 300;

export async function POST(request: Request) {
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to start a run." }, { status: 401 });
  }

  const form = await request.formData();
  const title = String(form.get("title") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const files = form.getAll("screens").filter((f): f is File => f instanceof File);
  const labels = form.getAll("labels").map(String);

  if (!files.length) {
    return NextResponse.json(
      { error: "Add at least one screenshot." },
      { status: 400 },
    );
  }

  const { data: run, error: runError } = await supabase
    .from("runs")
    .insert({
      user_id: user.id,
      title: title || "Untitled run",
      description,
      status: "pending",
    })
    .select("id")
    .single();
  if (runError || !run) {
    return NextResponse.json({ error: `Could not create the run: ${runError?.message}` }, { status: 500 });
  }

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const buf = Buffer.from(await file.arrayBuffer());

    let width = 0;
    let height = 0;
    try {
      const dims = imageSize(buf);
      width = dims.width ?? 0;
      height = dims.height ?? 0;
    } catch {
      // not fatal — bytes are what the load-time computation needs
    }

    const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
    const path = `${user.id}/${run.id}/${i + 1}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("screens")
      .upload(path, buf, { contentType: file.type || "image/png" });
    if (uploadError) {
      return NextResponse.json(
        { error: `Upload failed on screen ${i + 1}: ${uploadError.message}` },
        { status: 500 },
      );
    }

    const { error: screenError } = await supabase.from("screens").insert({
      run_id: run.id,
      position: i + 1,
      storage_path: path,
      width,
      height,
      bytes: buf.byteLength,
      label: labels[i]?.trim() || `Screen ${i + 1}`,
    });
    if (screenError) {
      return NextResponse.json(
        { error: `Could not record screen ${i + 1}: ${screenError.message}` },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ runId: run.id });
}
