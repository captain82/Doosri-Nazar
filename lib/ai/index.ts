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

// Per-call model choice. Persona generation is the quality seed; the
// walkthrough is the cost-dominant bucket. Sensible defaults per provider,
// each overridable via env (PERSONA_MODEL / WALK_MODEL).
const DEFAULT_MODELS: Record<ProviderName, { persona: string; walk: string }> = {
  anthropic: { persona: "claude-sonnet-5", walk: "claude-haiku-4-5" },
  openai: { persona: "gpt-4o", walk: "gpt-4o-mini" },
};

export const PERSONA_MODEL =
  process.env.PERSONA_MODEL || DEFAULT_MODELS[ACTIVE_PROVIDER].persona;
export const WALK_MODEL = process.env.WALK_MODEL || DEFAULT_MODELS[ACTIVE_PROVIDER].walk;
