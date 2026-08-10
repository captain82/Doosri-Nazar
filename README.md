# Setu · सेतु

**AI user testing for non-urban India.** A bridge between the people who build India's public services and the people they're actually for.

**Live:** https://setu-hq.vercel.app
**Repo:** https://github.com/captain82/setu
**Docs:** [CONTEXT.md](CONTEXT.md) (why every decision was made) · [ROADMAP.md](ROADMAP.md) (what's next)

---

## Try it in 30 seconds

- **See a real report — no sign-in:** open **[a sample field report](https://setu-hq.vercel.app/runs/demo)**. This is the actual output, five AI users walked through a telemedicine flow and 2 of 5 reached the end.
- **Run your own:** go to the [live site](https://setu-hq.vercel.app) → **Sign in** (magic link — enter any email, click the link, you're in) → **Test your flow**. Then either upload your own screenshots **or** click one of the four **ready-made sample flows** (doctor booking, a government scheme, a UPI payment, an electricity bill) and watch the real pipeline run end-to-end in ~a minute.

No screenshots handy? The sample flows are there exactly so you can see the whole thing without any prep.

---

## Who this is for

**Who exactly.** Two groups, one bridge:

- **The people who get designed out** — the hundreds of millions of Indians who came online in the last few years on a *first, budget smartphone*: first-language Hindi/Bhojpuri/Telugu/Tamil (not English), on *weak or throttled* connections, often operating an app *through a relative*. Public-service apps most need to reach them and most often lose them.
- **The people who build for them** — designers, PMs and developers at **Indian government departments, civic-tech orgs, and NGOs** shipping public-service flows: scheme applications, telemedicine, welfare / ration / pension portals, health.

**What changes for them.** Today a team ships a flow, and a citizen who is *entitled* to a pension, or *needs* a doctor, quietly gives up at the payment screen or the 24-hour clock — and the team finds out, if ever, as a support ticket. With Setu the team sees the break *before* launch: *"2 of 5 non-urban users abandoned your doctor-booking flow at the ₹299 payment — here's exactly why, and what to change."* The exclusion gets fixed while it's still cheap to fix, and the service actually becomes reachable.

**Why AI makes this possible now.** The honest answer to exclusion is real field testing — take the app to a village, watch someone use it. It's the right answer, and it's so slow and expensive that teams skip it entirely. A vision LLM can now (a) *see* the screens, (b) *role-play* a specific non-urban user grounded in real constraints, and (c) accumulate confusion screen-by-screen the way a first-timer does — producing a specific, drop-off-measured report in about a minute, for a few cents. That cheap first pass didn't exist a year ago. It's what makes testing *for the excluded* feasible at all.

This does **not** replace going to a village and watching someone use your app. It's the cheap first pass that clears the obvious breaks, so real field time is spent on what only real people can tell you.

---

## How it works (the algorithm)

The whole product is two model calls wrapped around one idea: **don't describe a user, simulate one — grounded in real constraints, and let them fail.**

**1. Read the flow.** A vision model reads your uploaded screens (in the order you set) and auto-drafts the title, category and description — so you can just upload and go, and so the model has demonstrably *seen* the flow.

**2. Cast five users from a mix of axes.** One model call generates five personas. Each is grounded in a different combination of real non-urban **axes**:

| Axis | Range |
|---|---|
| Language | first language + English comfort |
| Connection | `5G` · `4G` · `Weak 4G` · `Throttled` (post-data-cap, ~64 kbps) |
| Device | new · old · shared · first smartphone |
| Digital literacy | fluent → first-time |
| Proxy use | operating the app for a parent/spouse |

But backdrop alone produces five versions of the same person. So each persona also gets a **different dominant "lens"** — a distinct *way people actually fail* — drawn from a library of ~21 families: scam/trust fear, money counted in food-days, pride that won't admit confusion, a phone that's never private, a hospital-queue mental model, Aadhaar/e-KYC mismatch, agent-mediated first use, and so on. The lenses are **selected for relevance to your specific app** (a payment flow stresses money/trust/payment-fear; a government form stresses identity/documents/agent-use; telehealth stresses privacy/urgency), literacy is **capped at ≤2 of 5** so language never dominates the report, and at least one persona is a **proxy user**. This mix-of-axes-plus-lens is what makes five reports *five different reports* instead of the same complaint in five accents.

**3. Walk each user through the screens, in order, never seeing ahead.** Each persona is walked screen-by-screen; the model only ever sees screens up to where they are, so confusion **accumulates** like it does for a real first-timer. If a screen defeats them, they **drop off** and the walk ends there. (This is why "2 of 5 reached the end" means something — quitting was possible.)

**4. Load time is computed, never generated.** Each screen's byte weight ÷ the persona's connection throughput = seconds, passed *into* the simulation as a fact they experience — a throttled phone takes ~16s on a heavy screen, and that wait shapes their patience. If the model *invented* "14 seconds," the whole thing would be theatre; computing it is the line between a measurement tool and a plausible essay.

**5. Report.** You get a field report you can read **By user** or **By screen**, ask questions about (grounded chat that can focus on one user or screen), and **export** (PDF / Markdown).

The two invariants — **drop-off is real**, **load is computed** — are the reason this is a measurement tool and not a chat prompt. Everything else is built around them.

---

## Stack

Next.js 14 (App Router, TypeScript) · Tailwind · Supabase (magic-link auth, Postgres, storage) · `sharp` (server-side image downscaling before vision) · **pluggable LLM provider** (Anthropic Claude / OpenAI) · Vercel.

No charting, state-management, or component library — the app is a handful of screens and every dependency is a liability in a public, time-boxed build.

## Switching the AI provider

Both model calls (persona generation, walkthrough) go through a provider-neutral interface in `lib/ai/`. Swap vendors with environment variables — no code change:

| Var | Default | Notes |
|---|---|---|
| `AI_PROVIDER` | `anthropic` | `anthropic` or `openai` (**production runs `openai`**) |
| `PERSONA_MODEL` | per-provider | override the persona model |
| `WALK_MODEL` | per-provider | override the walkthrough model |
| `ANTHROPIC_API_KEY` | — | required when provider is `anthropic` |
| `OPENAI_API_KEY` | — | required when provider is `openai` |

Per-provider default models (both calls use the *strong* model on purpose — a cheap walkthrough model visibly degrades findings):

- **anthropic** — persona `claude-sonnet-5`, walk `claude-sonnet-5`
- **openai** — persona `gpt-4o`, walk `gpt-4o`

Both providers use structured-output JSON and image (vision) input; adding a third is one file in `lib/ai/`.

## Run it locally

```bash
npm install
npm run dev        # http://localhost:3000
```

**Environment** — create `.env.local` with (values are yours, never committed; the repo is public so keys are server-side only):

```
NEXT_PUBLIC_SUPABASE_URL=…
NEXT_PUBLIC_SUPABASE_ANON_KEY=…
SUPABASE_SERVICE_ROLE_KEY=…
OPENAI_API_KEY=…            # or ANTHROPIC_API_KEY
AI_PROVIDER=openai          # or anthropic
```

**Supabase setup** — create a project, run [`supabase/schema.sql`](supabase/schema.sql) (tables + row-level security), and add your dev/deploy URLs to **Auth → URL Configuration** so magic-link login redirects back correctly. The sample report at `/runs/demo` renders from `lib/fake-run.ts`, so you can see the results UI with zero backend set up.

---

## What's still rough (the honest part)

- **Chat history is browser-local** (`localStorage`), not yet in the DB — so report conversations aren't shareable by link yet.
- **The full logged-in run needs a human to verify** each release: magic-link auth can't be automated in CI, so the end-to-end path (upload → personas → walk → report) is checked by hand.
- Illustrations are 1× exports; crisp at current sizes, would want 2× for very high-DPI screens.

See [ROADMAP.md](ROADMAP.md) for where these (and reading straight from Figma / testing a live URL) are headed.

## Credit

Built for the [BestPossible.AI](https://bestpossible.ai) hackathon, building on the **Rural AI User Testing** idea from the Idea Wall.
