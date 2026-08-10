# Setu — project context & decisions

Context for understanding, evaluating, or rebuilding this project. Every significant decision is written down **with the reasoning behind it**, so a reviewer can see *why* each call was made and a builder doesn't re-litigate settled ground.

> This doc started as a pre-build plan (Aug 7 2026) and was **updated Aug 10 2026 to reflect the product as it actually shipped**. Where the plan and the build diverged, the build won and the "why" is recorded. The code plus `supabase/schema.sql` are the source of truth; this doc is the rationale.

---

## What this is

A web app that tests product designs against **non-urban Indian users** before they ship.

A designer uploads screenshots of a flow (or picks a ready-made sample) and, optionally, describes what it does. Setu generates five AI users grounded in real non-urban context — language, phone, connection speed, digital literacy, proxy use — and walks each one through the screens **in order, never seeing ahead**. The output is a field report showing where each user got stuck, what it cost them, and what to change.

Built for the **BestPossible.AI** hackathon (bestpossible.ai), on the Idea Wall entry **Rural AI User Testing**. Deadline **Aug 10 2026**.

**Name:** *Setu* (सेतु, Hindi for "bridge"). Renamed from the working title *Doosri Nazar* on Aug 9. **Why the rename:** "Setu" says what the product *does* in one word — it bridges the gap between a product and the people it's meant to serve — and it reads cleanly to an English-speaking judge while staying rooted in Indian language.

**Positioning:** most software in India is designed and tested by people with new phones, fast internet and good English. Everyone else gets designed out — not deliberately, just invisibly. Real field testing is the right answer but it's slow and expensive, so teams skip it. Setu is the cheap first pass. It does **not** replace going to a village and watching someone use your app; it clears the obvious breaks so real field time is spent on what only real people can tell you. Audience framing is deliberately **civic-tech / government / NGO** (public-service apps), not commercial SaaS — this is a *social-good* use of AI, which is what the hackathon rewards.

---

## Decisions already made — don't revisit

- **No Mixpanel, no event-data import, no Sankey diagrams.** Considered at length, cut for scope.
- **No live URL crawling.** Would require browser automation. Out of scope.
- **No Figma *parsing*.** Screenshot upload is the input. Figma's node structure doesn't give the AI the *rendered* visual it needs to reason like a first-time user, and the auth+parsing cost isn't worth it. (Figma was used *by us* only to design the landing page, not as a product input.)
- **Idea-only entry path** (describe an idea, get personas + expectations, no screens) was designed but cut. The screenshot path is the product.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14, App Router, TypeScript |
| Styling | Tailwind |
| Auth + DB + Storage | Supabase (magic-link auth, Postgres, storage) |
| Model | **Pluggable** — Anthropic Claude *or* OpenAI, behind one interface (see below) |
| Image processing | `sharp` (server-side downscaling before vision) |
| Deploy | Vercel |
| Repo | GitHub, public: `github.com/captain82/setu` |
| Live | `https://setu-hq.vercel.app` |

No charting library, no state-management library, no component library. **Why:** the whole app is a handful of screens; every dependency is a liability in a three-day build and a public repo.

**The model API keys live server-side only**, inside route handlers. Never in a `NEXT_PUBLIC_` variable — the repo is public. **Why it matters enough to repeat:** a leaked key in a public repo is the single most common way these submissions get burned.

Config is env-driven (names only, values in `.env.local` / Vercel): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, and the provider switches `AI_PROVIDER` / `PERSONA_MODEL` / `WALK_MODEL`. Setup = run `supabase/schema.sql`, set the Supabase Auth redirect URLs to the deploy domain, fill the env, deploy.

---

## The provider abstraction (added after the plan)

The plan hard-coded one Anthropic model. The build introduced a **provider-neutral layer** in `lib/ai/` (`types.ts` + `anthropic.ts` + `openai.ts` + `index.ts`). Both model calls go through one interface with two methods: `generateJSON` (structured output) and `streamText` (chat). You switch vendor with a single env var, `AI_PROVIDER=anthropic|openai`; models are overridable per call via `PERSONA_MODEL` / `WALK_MODEL`.

**Why we built it:**
- **Not to be hostage to one vendor** during a graded, time-boxed build — if one API has an outage or rate-limit on submission day, flip the env and redeploy.
- It **forced clean seams**: both calls reduced to "give me JSON" and "stream me tokens," which made the rest of the code simpler.
- It let us **A/B model quality on the real task.** Findings (Aug 8): **Claude Sonnet 5** is the sharpest and most grounded; **gpt-4o** is solid but slightly more generic; **Haiku 4.5** was too generic for the walkthrough. We shipped on **OpenAI gpt-4o** for both calls (active provider), after learning the hard way that a *cheap* walk model visibly degrades findings — see below.

**Why both calls use the STRONG model:** we initially split cost (cheap walk, strong persona-gen). The cheap walk model produced blander, more convergent findings, which is exactly the failure this product exists to avoid. Reverted both to the strong model. **The lesson recorded for anyone tempted to save tokens: walkthrough quality *is* the product — do not cut it.**

---

## Hackathon rubric (what's actually judged)

Clear purpose · built with AI · usable UI that looks good · responsive on laptop and phone · real user login · real backend that saves data · deployed live · open source. Plus an early-submission Spot prize that stacks — so we deployed a working slice on day one and kept improving it.

---

## Data model

```
runs      id, user_id→auth.users, title, description, status, created_at
            status: pending | generating | walking | done | error
screens   id, run_id, position (user-ordered, matters), storage_path,
            width, height, bytes (needed for load-time), label
personas  id, run_id, name, age, language, device, connection, context,
            initials, outcome, dropped_at_screen
            connection: "5G" | "4G" | "Weak 4G" | "Throttled"   ← see below
            outcome:    completed | struggled | dropped
            context:    the persona's ONE defining lens, in a sentence
steps     id, persona_id, screen_id, position, status, narrative,
            suggestion (null unless status != ok), metrics jsonb {load_seconds}
            status: ok | friction | dropped
```

Row-level security on every table, scoped to `user_id`. Exact DDL (incl. the connection `CHECK` constraint) is in `supabase/schema.sql` — that file, not this doc, is authoritative.

**Why the connection axis changed from the plan's `2G|3G|4G`:** it's 2026 — effectively **nobody is on 2G**. The real-world cost isn't a slow *generation* of radio, it's **weak signal** and **post-data-cap throttling** (~64 kbps once your pack runs out). So the axis is **5G / 4G / Weak 4G / Throttled**, which models what actually stops people today. (This required a live migration to relax the old `CHECK` constraint — recorded here because a fresh clone must apply the current `schema.sql`, not the plan's SQL.)

---

## Request flow

The walkthrough is too slow for one request. It's split so the client shows progress and never hits a serverless timeout.

```
POST /api/infer                      read-it-back: vision reads the screenshots and
                                     returns {title, category, description}          (~few s)
POST /api/runs                       create run, upload screens to storage,
                                     record bytes + dimensions server-side  -> {runId}
POST /api/runs/:id/personas          one call: description + first screen -> 5 personas (~9s)
POST /api/runs/:id/personas/:pid/walk called once per persona, IN PARALLEL from the client;
                                     loops screens sequentially inside; writes steps  (~20-30s each)
POST /api/runs/:id/finish            mark the run done
GET  /api/runs/:id                   everything, for the results page
POST /api/runs/:id/chat              streamed Q&A grounded in the finished report
```

The client fires all five walk calls at once and renders each persona card as its response lands. **The progressive reveal is a feature, not a loading state** — it's what makes the demo feel alive. (We lean into it: the loading copy narrates the real pipeline, and each still-walking card names the screen it's "on.")

**`/api/infer` (read-it-back) was added after the plan. Why:** requiring a written description before anything happens is friction. Letting the vision model read the screens and pre-fill the title/category/description means a user can **just upload and go** — and it doubles as proof the model actually *sees* the flow.

**Vercel maxDuration=300 on the AI routes.** **Why:** persona-gen is ~9s locally but the serverless function occasionally stalled and got killed at the default 60s, and Vercel's timeout page then broke the client's `res.json()`. Root cause was a connection stall, not slowness — fixed with a longer ceiling, a client timeout+retry, and defensive body parsing.

---

## The two prompts

This is where product quality actually lives. Most of the effort went here.

### Persona generation — and the anti-convergence system

Input: feature description + first screenshot. Output: five personas as validated JSON (structured-output, no preamble, retry on mismatch).

The single biggest risk is **five personas that are the same person in five accents** — all failing for "it's in English." The plan said "span language, connection, device, literacy, proxy use"; the build turned that into an explicit system:

- A **lens library** (`LENS_POOL`, ~21 distinct failure *families*: scam-survivor/trust-fear, daily-wage money-shape, proud silent-failer, borrowed/monitored phone, voice-only input, one-app mental model, hospital-queue prior model, agent/CSC-mediated first use, Aadhaar/e-KYC mismatch, and so on).
- Each persona gets a **different dominant lens**; **literacy is capped at ≤2 of 5** so language never dominates the report.
- Selection is **relevance-based, not random**: the persona call already sees the first screen + description, so the model picks the lenses most likely to break **this** product (payments → trust/money/payment-fear; a govt form → identity/agent-use/document literacy; telehealth → privacy/urgency).
- At least one **proxy user** (operating the app for someone else) and at least two on degraded connection.

**Why this exists:** without it, findings converge and the tool reads like a generic "your app should be more accessible" essay. The lens system is what makes five reports *five different reports*.

Personas must be specific, not archetypes. Not "low digital literacy user" but *"Ramesh Yadav, 46, Bhojpuri first language, Throttled after his data pack, first smartphone in 2024."*

### Walkthrough

Per persona, per screen, in order. The message array carries forward what the persona has already seen and understood, so **confusion accumulates** the way it would for a real first-timer.

**Never send future screens.** If the model can see screen 4 while reasoning about screen 2, it stops behaving like a first-timer. This is the single most important implementation detail. The prompt also *leads from the persona's lens* on every screen and is explicitly told **not to converge** or default to "it's in English."

Each step returns `status` (ok | friction | dropped), a concrete one/two-sentence `narrative`, and a `suggestion` **only when it's not ok**. Once a persona drops, the loop stops for them. **Drop-off is the strongest single output** — "2 of 5 reached the end" only means something because quitting was possible.

### Load time is computed, never generated

Screen `bytes` ÷ connection throughput → seconds, passed **into** the prompt as a fact the persona experiences. **Why it's non-negotiable:** if the model *invents* "14 seconds" and a judge checks, the whole thing reads as theatre. Computing it is the line between a *measurement tool* and a plausible-sounding essay generator. (Throughput map lives with the walk logic; the throttled tier reflects ~64 kbps.)

### What good output looks like

- Slots shown as 14:00 and 16:30; she reads time as morning or evening and picked the wrong one.
- Upload asks for a PDF; she has photos on her phone, not files, and there's no camera option.
- ₹299 due upfront by UPI with nothing about what happens if the doctor doesn't join; she closed the app.

None are accessibility-checklist items. That's the point.

---

## The report is actionable — chat & export (added after the plan)

The plan said "no chat sidebar unless everything else is finished." Everything else got finished, so it was built — because a report you can only *read* is half a tool.

- **Report chat** (`/api/runs/:id/chat`, streamed): **one merged conversation** per report. Each persona card and each screen offers outcome-aware suggested questions; tapping one focuses the model on that user/screen (with a scope badge) while keeping one continuous thread so cross-scope follow-ups keep context. Grounded in a compact digest of the report; persisted per-run in `localStorage` (ephemeral, no DB — deliberately, to avoid scope creep). **Why:** it turns findings into decisions — "what do I fix first," "draft tickets," "why did users drop."
- **Export** (PDF via print stylesheet + one-click Markdown): a designer/PM needs to *share* the report. **Why print-based PDF:** zero dependencies, and the print CSS doubles as a clean, chrome-free document.

---

## Screens

1. **Login** — Supabase magic link. Kept minimal on purpose.
2. **New run** — drag-drop screenshots with reordering + optional description, **or** one-click **sample flows** (see below). Deliberately minimal: the upload box is small, copy is trimmed, so a first-time visitor isn't overwhelmed.
3. **Loading** — personas appearing one at a time, then walkthroughs completing, with narrated status. This is demo footage; treated as design work.
4. **Results** — the screen the submission is judged on.

### Sample flows (added after the plan)

Four ready-made public-service flows (telemedicine booking, a government welfare/Aadhaar application, a first UPI payment, an electricity-bill payment), each a set of **mock mobile screenshots** we built (`public/samples/`) with deliberate friction baked in (English-only labels, 24-hour time slots, Aadhaar OTP-to-linked-mobile, UPI PIN). One click loads them and runs the **real** pipeline.

**Why:** the biggest drop-off for a judge or first-time visitor is "I don't have screenshots handy." Samples remove that entirely and let anyone see the full product in ~two clicks — and the flows are chosen to span categories so the persona lens system visibly produces *different* failures each time. The mocks are ours (not real apps) to avoid copyright and keep the friction intentional.

---

## Results screen spec

Built **first**, with hardcoded fake data (`lib/fake-run.ts`) before any auth or model work. **Why:** it settles the data shape before a prompt is written and guarantees something demoable always exists.

Layout, top to bottom:

- **Summary strip** — three metric cards: users tested, how many reached the end (red when it's a minority, with a small completion meter), worst screen by name. Each is a soft-tinted card with a small icon.
- **Toggle — "By user" / "By screen".** Same data, two cuts. **By-user** is a grid of **colourful pastel persona cards** (one tint per person) — each showing the persona's key moment and expanding, full-width, into the step-by-step walkthrough. **By-screen** is row-based cards, one per screen, listing every persona who hit it. The by-screen view is what makes it *actionable*; by-user is what makes it feel *alive*.
- **Persona card** — name + age, a quiet outcome indicator (dot + label), the language·connection line, and the persona's **key moment** ("Where they quit · Choose Doctor"). Expanding shows numbered steps colour-coded by severity (green ok / amber friction / red dropped), each with the screen label, the narrative, computed metrics as neutral tags (`16.0s to load · Throttled`), and — **only on failures** — a "Fix" suggestion in a soft tint. If every step carried a recommendation, none would feel urgent.

Design register is deliberately calm and editorial (a "field report"), small type, lots of whitespace — see the brand note.

---

## Brand & landing (design decisions)

- **Setu wordmark** (Instrument Serif italic, coral) over a **DM Sans** tagline — a serif/sans pairing that feels human, not corporate.
- **Illustration collage** of non-urban India (hand-drawn, torn-paper edges) flanking the hero, because the whole thesis is *these are real people, not metrics*.
- **White background, warm accents** (terracotta/coral), small type. **Why:** the audience is civic/NGO/government — the tool has to read as *serious research*, not SaaS hype. We deliberately borrowed only *tasteful* bits of playful design (a hand-drawn arrow, a variables marquee) and rejected the busier ones.

---

## Failure modes to expect

- **JSON parse failures** — most likely. Structured output + one retry; write an `error` state rather than crashing a run.
- **Latency** — five personas × N screens is many calls. Parallel across personas keeps it near ~30s. If it creeps, drop to four personas; **never** collapse the sequential per-persona loop.
- **Serverless timeout** — the persona-gen stall; solved with maxDuration=300 + client retry + defensive parsing.
- **Anthropic `cache_control` cap** — max 4 breakpoints/request; the walk carries screens forward, so use **one moving breakpoint on the latest image**, not one per screen, or it 400s at screen 3.
- **Generic findings** — the lens system above is the fix.

**If time runs short, cut in this order:** by-screen view → chat → drop to four personas. **Never** cut the drop-off logic or the load-time computation — those two are the reason this isn't just a chat prompt.

---

## Deliverables for submission

- Deployed live URL — `https://setu-hq.vercel.app`
- Public GitHub repo — `github.com/captain82/setu`
- README: the problem, what it does, how to run it, provider-switch table, credit to the Rural AI User Testing idea
- Screencast of the product plus a short walkthrough of how it was built. Demo a **public-service flow** (telemedicine / scheme / ration), never a SaaS pricing page — that single choice does more for positioning than any feature.
