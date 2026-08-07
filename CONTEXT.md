# Doosri Nazar — project handoff

Context for building this from scratch in Claude Code. Everything below was decided over a long planning conversation; the reasoning is included so you don't re-litigate settled calls.

---

## What this is

A web app that tests product designs against non-urban Indian users before they ship.

A designer uploads screenshots of a flow and describes what it does. The system generates AI users grounded in real non-urban context — language, phone, connection speed, digital literacy, proxy use — and walks each one through the screens in order. The output is a report showing where each user got stuck, what it cost them, and what to change.

It's a submission for the BestPossible.AI hackathon (bestpossible.ai), building on an Idea Wall entry called **Rural AI User Testing**. Submission deadline is **Aug 10, 2026**.

**Positioning line:** most software in India is designed and tested by people with new phones, fast internet and good English. Everyone else gets designed out — not deliberately, just invisibly. Real field testing is the right answer but it's slow and expensive, so teams skip it. This is the cheap first pass. It does not replace going to a village and watching someone use your app; it clears the obvious breaks so real testing is spent on what only real people can tell you.

---

## Decisions already made — don't revisit

- **No Mixpanel, no event-data import, no Sankey diagrams.** Considered at length, cut for scope.
- **No Figma MCP integration.** Screenshot upload only. Figma's structure doesn't give you the visual rendering an AI needs to reason about, and the auth plus parsing work isn't worth it in three days.
- **No live URL crawling.** Would require browser automation. Out of scope.
- **No chat sidebar on the results page** unless everything else is finished.
- **Second entry path (describe an idea, get personas and their expectations, no screens)** is designed but is the first thing to cut. Build the screenshot path first.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14, App Router, TypeScript |
| Styling | Tailwind |
| Auth + DB + Storage | Supabase |
| Model | Anthropic API, `claude-sonnet-4-6` (vision) |
| Deploy | Vercel |
| Repo | GitHub, public from the first commit |

No charting library, no state management library, no component library.

**The API key lives server-side only**, in a route handler. Never in a `NEXT_PUBLIC_` variable — the repo is public.

---

## Hackathon rubric (what's actually being judged)

Clear purpose · built with AI · usable UI that looks good · responsive on laptop and phone · real user login · real backend that saves data · deployed live · open source.

There's also a Spot prize (₹10,000) for early submissions that stacks with the main prizes — so deploy something working as early as possible and keep improving it.

---

## Data model

```sql
runs
  id uuid pk
  user_id uuid -> auth.users
  title text
  description text          -- what the feature does, who it's for
  status text               -- pending | generating | walking | done | error
  created_at timestamptz

screens
  id uuid pk
  run_id uuid -> runs
  position int              -- user-defined order, matters
  storage_path text
  width int
  height int
  bytes int                 -- needed for load-time computation
  label text                -- "Payment", "Documents"

personas
  id uuid pk
  run_id uuid -> runs
  name text
  age int
  language text
  device text
  connection text           -- 2G | 3G | 4G
  context text              -- one line, e.g. "has never paid online"
  initials text
  outcome text              -- completed | struggled | dropped
  dropped_at_screen int null

steps
  id uuid pk
  persona_id uuid -> personas
  screen_id uuid -> screens
  position int
  status text               -- ok | friction | dropped
  narrative text            -- what they did and why
  suggestion text null      -- only when status != ok
  metrics jsonb             -- { load_seconds: 14.2 }
```

Row-level security on every table, scoped to `user_id`.

---

## Request flow

The walkthrough is too slow for a single request. Split it so the client shows progress and you never hit a serverless timeout.

```
POST /api/runs
  create run, upload screens to Supabase storage,
  record bytes + dimensions server-side
  -> { runId }

POST /api/runs/:id/personas
  one model call: description + first screen image
  -> 5 persona rows          (~10s)

POST /api/runs/:id/personas/:pid/walk
  called once per persona, IN PARALLEL from the client
  loops screens sequentially inside
  writes step rows as it goes  (~20-30s each, concurrent)

GET /api/runs/:id
  everything, for the results page
```

The client fires all five walk calls at once and renders each persona card as its response lands. The progressive reveal is what makes the demo feel alive — treat it as a feature, not a loading state.

---

## The two prompts

These are where the product quality actually lives. Budget real time on them.

### Persona generation

Input: feature description + first screenshot.

Output: JSON array of five personas spanning language, connection quality, device age, digital literacy, and **proxy use** (someone operating the app on behalf of a parent — extremely common in India and it breaks assumptions everywhere).

Force JSON via a system instruction with no preamble. Parse inside try/catch with one retry.

Personas must be specific, not archetypes. Not "low digital literacy user" but "Ramesh Yadav, 46, Bhojpuri first language, 2G, first smartphone in 2024."

### Walkthrough

Per persona, per screen, in order. The message array carries forward what the persona has already seen and understood, so confusion accumulates the way it would for a real first-time user.

**Never send future screens.** If the model can see screen 4 while reasoning about screen 2, it stops behaving like a first-timer. This is the single most important implementation detail.

Response shape per step:

```json
{
  "status": "ok" | "friction" | "dropped",
  "narrative": "one or two sentences, concrete",
  "suggestion": "only if status is not ok, else null",
  "continues": true | false
}
```

If `continues` is false, stop the loop for that persona. Drop-off is the strongest single output — "2 of 5 reached the end" only means something if quitting was possible.

### Load time is computed, never generated

`bytes / 30000` for 2G, `bytes / 120000` for 3G, `bytes / 400000` for 4G. Pass the resulting number **into** the prompt as a fact the persona experiences.

If the model invents "14 seconds" and a judge checks, the whole thing looks like theatre. This is the line between a measurement tool and a plausible-sounding essay generator.

### Avoiding generic output

If findings come back like "the button placement is unclear," the prompt is too vague. Fix it by naming the persona's specific constraint in every turn — her language, her connection, her phone, her prior experience — and asking what it cost her. Good findings look like:

- Slots shown as 14:00 and 16:30; she reads time as morning or evening and picked the wrong one.
- Upload asks for a PDF; she has photos on her phone, not files, and there's no camera option.
- ₹299 due upfront by UPI with nothing saying what happens if the doctor doesn't join; she closed the app.

None of those are accessibility-checklist items. That's the point.

---

## Screens

1. **Login** — Supabase magic link. 30 minutes, don't gold-plate.
2. **New run** — drag-drop screenshots with reordering, feature description field, one button.
3. **Loading** — personas appearing one at a time, then walkthroughs completing. This is demo footage; treat it as design work.
4. **Results** — see spec below.

---

## Results screen spec

This is the screen the submission is judged on. Build it **first**, with hardcoded fake data in a separate file, before any auth or model work. It forces the data shape to be settled before the prompt is written, and it means you always have something demoable.

Layout, top to bottom:

**Summary strip** — three metric cards: users run, how many reached the end (in red when it's most of them), worst screen by name.

**Toggle** — "By user" / "By screen". Same data, two cuts. The by-screen view is what makes it actionable; the by-user view is what makes it feel alive. By-screen is cuttable if time runs short.

**Persona cards** — worst outcome expanded by default, the rest collapsed to a single row. Five expanded cards is an unreadable wall.

Each card header: initials avatar in a soft colour, name and age, one line of context (language · connection · a defining detail), and an outcome badge on the right (red "Left at screen 3", amber "Finished, struggled", green "Completed").

Each expanded card body: numbered steps down the left in a small circle, colour-coded by severity — green ok, amber friction, red dropped. Then the step's screen label, the narrative in secondary text, computed metrics as small neutral tags (`14.2s to load on 2G`), and — **only on failures** — a suggestion box in a soft accent tint. If every step carries a recommendation, none of them feel urgent.

Once it works, add a thin strip of the actual uploaded screenshot beside each step. That's what stops the report reading as generated text and anchors it to their real design.

---

## Build order

Aug 7 was mostly planning, so this is three working days.

**First — results screen with fake data.** No auth, no upload, no model. Hardcode the JSON in a separate file so swapping it for a fetch is a one-line change.

**Then, in order:**
1. Supabase project, tables, RLS
2. Upload screen → storage, reading bytes and dimensions server-side
3. Persona generation prompt, tuned against real screenshots
4. Walkthrough loop, sequential per persona
5. Parallel dispatch from the client, steps rendering as they land
6. Loading state with progressive reveal
7. Auth (Supabase drop-in, 30 min, do it whenever)
8. Responsive pass — check on a real phone, not devtools
9. By-screen view
10. Error and empty states, one retry on bad JSON

**Deploy to Vercel on day one.** Vercel deploys always break the first time. Find that out when it costs an hour, not on Aug 10.

---

## Failure modes to expect

- **JSON parse failures** — most likely. Retry once, then write an `error` step rather than crashing the run.
- **Latency** — five personas × four screens is twenty calls. Parallel across personas keeps it near 30s. If it creeps past a minute, drop to four personas; do not collapse the sequential loop.
- **Generic findings** — see the prompt section above.

**If Aug 9 goes badly, cut in this order:** by-screen view → idea-only entry path → drop to three personas. Never cut the drop-off logic or the load-time computation. Those two are the reason this isn't just a chat prompt.

---

## Test flows to have ready

Screenshot these yourself, today:

- A state government scheme application
- A telemedicine booking flow
- A ration or pension portal
- One polished consumer app as contrast — shows the tool finds real problems even in good products

The screencast should demo a public service flow, not a SaaS pricing page. That single choice does more for positioning than any feature.

---

## Deliverables for submission

- Deployed live URL
- Public GitHub repo
- README: the problem, what it does, how to run it, and credit to the Rural AI User Testing idea it builds on
- Screencast of the product plus a short walkthrough of how it was built
