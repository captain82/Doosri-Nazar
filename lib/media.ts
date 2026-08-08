import type { SupabaseClient } from "@supabase/supabase-js";
import sharp from "sharp";
import type { AiImage } from "./ai/types";

// Effective throughput in bytes/second. India is nominally on 4G/5G, but real
// experienced speed varies — weak/congested signal, and a phone throttled to
// ~64kbps after the daily data pack runs out. Load time is COMPUTED from real
// screenshot bytes and passed into the prompt as a fact, never generated.
const THROUGHPUT: Record<string, number> = {
  "5G": 1_500_000,
  "4G": 400_000,
  "Weak 4G": 100_000,
  Throttled: 12_000,
};

export function loadSeconds(bytes: number, connection: string): number {
  const bps = THROUGHPUT[connection] ?? THROUGHPUT["Weak 4G"];
  return Math.round((bytes / bps) * 10) / 10;
}

// Downscale a screenshot for the model: long edge to 1200px, JPEG q78 — ~72%
// fewer image tokens than the original PNG with no legibility loss. The
// ORIGINAL file stays in storage; load-time math uses its bytes, not this copy.
async function downscale(buf: Buffer): Promise<string> {
  const out = await sharp(buf)
    .rotate()
    .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 78 })
    .toBuffer();
  return out.toString("base64");
}

// Download a private screenshot, downscale it, and return a provider-neutral
// image. Cached per path within one request so a screen re-sent across turns
// isn't re-downloaded or re-encoded.
export async function imageData(
  supabase: SupabaseClient,
  cache: Map<string, string>,
  path: string,
): Promise<AiImage> {
  let base64 = cache.get(path);
  if (!base64) {
    const { data: blob, error } = await supabase.storage.from("screens").download(path);
    if (error || !blob) throw new Error(`could not read screen ${path}: ${error?.message}`);
    base64 = await downscale(Buffer.from(await blob.arrayBuffer()));
    cache.set(path, base64);
  }
  return { base64, mediaType: "image/jpeg" };
}
