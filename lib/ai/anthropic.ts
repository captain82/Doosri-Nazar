import Anthropic from "@anthropic-ai/sdk";
import type {
  ImageBlockParam,
  MessageParam,
  TextBlockParam,
} from "@anthropic-ai/sdk/resources/messages";
import type { AiMessage, AiProvider, GenerateJSONArgs } from "./types";

// 55s per-request timeout + one retry so a stalled serverless connection aborts
// and recovers instead of hanging until the platform kills the function.
let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic({ timeout: 55_000, maxRetries: 1 }));

function toMessages(messages: AiMessage[]): MessageParam[] {
  let lastImage: ImageBlockParam | null = null;
  const out: MessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.content.map((p) => {
      if (p.type === "text") return { type: "text", text: p.text } as TextBlockParam;
      const block: ImageBlockParam = {
        type: "image",
        source: {
          type: "base64",
          media_type: p.image.mediaType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
          data: p.image.base64,
        },
      };
      lastImage = block;
      return block;
    }),
  }));
  // Moving cache breakpoint on the most-recent image: its prefix (prior screens,
  // already cached) is read, and it writes the new screen. Stays under the
  // 4-breakpoint cap alongside the (≤3) system segments.
  if (lastImage) (lastImage as ImageBlockParam).cache_control = { type: "ephemeral" };
  return out;
}

export const anthropicProvider: AiProvider = {
  name: "anthropic",
  async generateJSON<T>({
    model,
    system,
    messages,
    schema,
    maxTokens = 1500,
  }: GenerateJSONArgs): Promise<T> {
    const segments = Array.isArray(system) ? system : [system];
    const sys: TextBlockParam[] = segments.map((text, i) => ({
      type: "text",
      text,
      ...(i < 3 ? { cache_control: { type: "ephemeral" as const } } : {}),
    }));
    const msgs = toMessages(messages);

    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await getClient().messages.create({
        model,
        max_tokens: maxTokens,
        thinking: { type: "disabled" },
        system: sys,
        messages: msgs,
        output_config: { format: { type: "json_schema", schema } },
      } as Anthropic.MessageCreateParamsNonStreaming);

      const text = res.content.find((b) => b.type === "text");
      if (text && text.type === "text") {
        try {
          return JSON.parse(text.text) as T;
        } catch {
          // retry once
        }
      }
    }
    throw new Error("Anthropic did not return valid JSON after one retry");
  },
};
