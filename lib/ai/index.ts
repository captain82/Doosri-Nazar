import { anthropicProvider } from "./anthropic";
import { openaiProvider } from "./openai";
import type { AiProvider } from "./types";

export type ProviderName = "anthropic" | "openai";

// Flip the whole app between vendors with one env var (default: anthropic).
export const ACTIVE_PROVIDER: ProviderName =
  process.env.AI_PROVIDER === "openai" ? "openai" : "anthropic";

const PROVIDERS: Record<ProviderName, AiProvider> = {
  anthropic: anthropicProvider,
  openai: openaiProvider,
};

export function getProvider(): AiProvider {
  return PROVIDERS[ACTIVE_PROVIDER];
}

// Per-call model choice. Both calls default to the STRONG model, the cheap
// model on the walkthrough measurably hurt finding quality in real use. Drop
// WALK_MODEL to a cheaper model (claude-haiku-4-5 / gpt-4o-mini) only if you
// consciously want to trade quality for cost.
const DEFAULT_MODELS: Record<ProviderName, { persona: string; walk: string }> = {
  anthropic: { persona: "claude-sonnet-5", walk: "claude-sonnet-5" },
  openai: { persona: "gpt-4o", walk: "gpt-4o" },
};

export const PERSONA_MODEL =
  process.env.PERSONA_MODEL || DEFAULT_MODELS[ACTIVE_PROVIDER].persona;
export const WALK_MODEL = process.env.WALK_MODEL || DEFAULT_MODELS[ACTIVE_PROVIDER].walk;
