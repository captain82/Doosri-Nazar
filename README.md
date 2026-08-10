# Setu · सेतु

**A bridge between the people who build India's public services and the people they're for.**

Live: **https://setu-app.vercel.app** · Sample report: [/runs/demo](https://setu-app.vercel.app/runs/demo)

## The problem

Most software in India is designed and tested by people with new phones, fast internet and good English. Everyone else gets designed out — not deliberately, just invisibly. Real field testing is the right answer, but it's slow and expensive, so teams skip it entirely.

## What it does

Upload screenshots of a flow and describe what it does. Setu generates AI users grounded in real non-urban Indian context — language, device age, connection speed, digital literacy, proxy use (operating an app on someone else's behalf) — and walks each one through your screens **in order, never seeing ahead**, so confusion accumulates the way it does for a real first-time user.

The output is a field report: where each user got stuck, what it cost them, and what to change.

Two details make this a measurement tool rather than an essay generator:

- **Drop-off is real.** Personas can quit. "2 of 5 reached the end" only means something because quitting was possible.
- **Load times are computed, never generated.** Screen weight ÷ connection speed (2G/3G/4G) is passed *into* the simulation as a fact the persona experiences.

This is not a replacement for going to a village and watching someone use your app. It's the cheap first pass that clears the obvious breaks, so real field time is spent on what only real people can tell you.

## Stack

Next.js 14 (App Router, TypeScript) · Tailwind · Supabase (auth, DB, storage) · pluggable LLM provider (Anthropic Claude / OpenAI) · Vercel

## Switching the AI provider

The two model calls (persona generation, walkthrough) go through a
provider-neutral interface in `lib/ai/`. Swap vendors with environment
variables — no code change:

| Var | Default | Notes |
|---|---|---|
| `AI_PROVIDER` | `anthropic` | `anthropic` or `openai` |
| `PERSONA_MODEL` | per-provider | override the persona-generation model |
| `WALK_MODEL` | per-provider | override the walkthrough model |
| `ANTHROPIC_API_KEY` | — | required when `AI_PROVIDER=anthropic` |
| `OPENAI_API_KEY` | — | required when `AI_PROVIDER=openai` |

Per-provider default models:

- **anthropic** — persona `claude-sonnet-5`, walk `claude-haiku-4-5`
- **openai** — persona `gpt-4o`, walk `gpt-4o-mini`

To run OpenAI: set `OPENAI_API_KEY`, then `AI_PROVIDER=openai`
(`vercel env add …` for production). Both providers use structured-output JSON
and image (vision) input; adding a third provider is one file in `lib/ai/`.

## Run it locally

```bash
npm install
npm run dev
```

Backend pipeline (Supabase + Anthropic) is in progress; the sample report at `/runs/demo` renders from `lib/fake-run.ts`.

## Credit

Built for the [BestPossible.AI](https://bestpossible.ai) hackathon, building on the **Rural AI User Testing** idea from the Idea Wall.
