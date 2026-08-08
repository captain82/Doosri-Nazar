import type { SupabaseClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import sharp from "sharp";
import { anthropic, MODEL } from "./anthropic";

// Downscale a screenshot for the model: long edge to 1200px, JPEG q78. A phone
// screenshot (1080×2280) otherwise hits the high-res vision tier at ~4k tokens;
// this keeps UI detail legible while cutting image tokens ~60-70%. The ORIGINAL
// file stays in storage — load-time math uses its bytes, not this copy.
async function downscale(buf: Buffer): Promise<string> {
  const out = await sharp(buf)
    .rotate()
    .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 78 })
    .toBuffer();
  return out.toString("base64");
}

// Download a private screenshot, downscale it, and return a base64 image block.
// Cached per path within one request so a screen re-sent across turns isn't
// re-downloaded or re-encoded.
export async function imageBlock(
  supabase: SupabaseClient,
  cache: Map<string, string>,
  path: string,
): Promise<Anthropic.ImageBlockParam> {
  let data = cache.get(path);
  if (!data) {
    const { data: blob, error } = await supabase.storage.from("screens").download(path);
    if (error || !blob) throw new Error(`could not read screen ${path}: ${error?.message}`);
    data = await downscale(Buffer.from(await blob.arrayBuffer()));
    cache.set(path, data);
  }
  return { type: "image", source: { type: "base64", media_type: "image/jpeg", data } };
}

// One structured-JSON call with thinking off, schema-forced output, and one
// retry if the model somehow returns unparseable JSON.
export async function jsonCall<T>({
  system,
  messages,
  schema,
}: {
  system: Anthropic.TextBlockParam[];
  messages: Anthropic.MessageParam[];
  schema: object;
}): Promise<T> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1500,
      thinking: { type: "disabled" },
      system,
      messages,
      output_config: { format: { type: "json_schema", schema } },
    } as Anthropic.MessageCreateParamsNonStreaming);

    const text = res.content.find((b) => b.type === "text");
    if (text && text.type === "text") {
      try {
        return JSON.parse(text.text) as T;
      } catch {
        // fall through to retry
      }
    }
  }
  throw new Error("model did not return valid JSON after one retry");
}
