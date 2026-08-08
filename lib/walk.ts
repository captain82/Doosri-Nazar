import type { SupabaseClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { anthropic, MODEL, mediaTypeFor } from "./anthropic";

// Download a private screenshot from storage and return it as a base64 image
// block, ready to drop into a message. Cached per path within one request so a
// screen re-sent across turns isn't re-downloaded.
export async function imageBlock(
  supabase: SupabaseClient,
  cache: Map<string, string>,
  path: string,
): Promise<Anthropic.ImageBlockParam> {
  let data = cache.get(path);
  if (!data) {
    const { data: blob, error } = await supabase.storage.from("screens").download(path);
    if (error || !blob) throw new Error(`could not read screen ${path}: ${error?.message}`);
    data = Buffer.from(await blob.arrayBuffer()).toString("base64");
    cache.set(path, data);
  }
  return { type: "image", source: { type: "base64", media_type: mediaTypeFor(path), data } };
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
