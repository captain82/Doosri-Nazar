import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type { AiMessage, AiProvider, GenerateJSONArgs } from "./types";

// Lazy client so importing this module doesn't throw when OPENAI_API_KEY is
// unset (e.g. while Anthropic is the active provider).
let client: OpenAI | null = null;
const getClient = () => (client ??= new OpenAI({ timeout: 55_000, maxRetries: 1 }));

function toMessages(system: string, messages: AiMessage[]): ChatCompletionMessageParam[] {
  const out: ChatCompletionMessageParam[] = [{ role: "system", content: system }];
  for (const m of messages) {
    if (m.role === "assistant") {
      // We only ever feed back the JSON we generated; join any text parts.
      const text = m.content
        .filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => p.text)
        .join("\n");
      out.push({ role: "assistant", content: text });
    } else {
      out.push({
        role: "user",
        content: m.content.map((p) =>
          p.type === "text"
            ? { type: "text", text: p.text }
            : {
                type: "image_url",
                image_url: { url: `data:${p.image.mediaType};base64,${p.image.base64}` },
              },
        ),
      });
    }
  }
  return out;
}

export const openaiProvider: AiProvider = {
  name: "openai",
  async generateJSON<T>({
    model,
    system,
    messages,
    schema,
    schemaName,
    maxTokens = 1500,
  }: GenerateJSONArgs): Promise<T> {
    const sys = Array.isArray(system) ? system.join("\n\n") : system;
    const msgs = toMessages(sys, messages);

    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await getClient().chat.completions.create({
        model,
        max_completion_tokens: maxTokens,
        messages: msgs,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: schemaName,
            strict: true,
            schema: schema as Record<string, unknown>,
          },
        },
      });

      const content = res.choices[0]?.message?.content;
      if (content) {
        try {
          return JSON.parse(content) as T;
        } catch {
          // retry once
        }
      }
    }
    throw new Error("OpenAI did not return valid JSON after one retry");
  },
};
