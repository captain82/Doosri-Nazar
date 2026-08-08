// Provider-neutral shapes so persona generation and the walkthrough don't
// depend on any one vendor's SDK. Adapters (anthropic.ts, openai.ts) translate
// these into vendor calls.

export interface AiImage {
  base64: string;
  mediaType: string;
}

export type AiPart =
  | { type: "text"; text: string }
  | { type: "image"; image: AiImage };

export interface AiMessage {
  role: "user" | "assistant";
  content: AiPart[];
}

export interface GenerateJSONArgs {
  model: string;
  // A string, or ordered system segments (stable-first). Providers that support
  // prompt caching cache the segment boundaries; others just join them.
  system: string | string[];
  messages: AiMessage[];
  schema: object;
  schemaName: string;
  maxTokens?: number;
}

export interface ChatTurn {
  role: "user" | "assistant";
  text: string;
}

export interface StreamTextArgs {
  model: string;
  system: string;
  messages: ChatTurn[];
  maxTokens?: number;
}

export interface AiProvider {
  readonly name: string;
  // Returns validated JSON matching `schema`, retrying once on unparseable output.
  generateJSON<T>(args: GenerateJSONArgs): Promise<T>;
  // Streams a free-text answer token by token (for the report chat).
  streamText(args: StreamTextArgs): AsyncIterable<string>;
}
