# Setu — roadmap

Where this goes next. Setu ships as a focused three-day build: **screenshots in → a grounded field report out.** That scope was deliberate (see `CONTEXT.md` for the cuts). The roadmap widens it in three directions — **more ways to bring a flow in**, **deeper reports**, and **sharing across a team** — without ever giving up the two things that make it a measurement tool rather than an essay generator: real drop-off, and computed load times.

Roughly ordered by value-to-effort.

---

## Wider inputs — more ways to bring a flow in

Today the input is uploaded screenshots (plus one-click samples). The clearest next step is meeting designers where their work already lives.

- **Read directly from Figma (MCP).** Point Setu at a Figma frame/flow and pull the rendered screens automatically, in order — no manual export. *Deferred in v1 because Figma's node structure isn't the rendered visual an AI needs to reason like a first-time user; the fix is to render frames to images via the Figma MCP, then feed the same pipeline. Removes the biggest bit of manual work for the people most likely to use this.*

- **Test a flow from a live URL.** Paste a URL, Setu drives the flow in a headless browser, captures each screen in order, and runs the same walkthrough. *Deferred in v1 (browser automation is its own project). This unlocks testing real, shipped products — the strongest possible demo — and catches issues screenshots can't, like real load times and interaction state.*

- **Idea-only entry path.** Describe a flow in words (no screens) and get the personas and what they'd expect at each step — useful before any design exists. *Designed in v1, cut first for scope; a natural early-stage companion to the screenshot path.*

---

## Deeper reports — get more out of each run

- **Screenshots inside the chat.** Give the report chat the actual screens so it can point at specific pixels ("the language toggle is hidden behind this icon"), not just reason from the text digest.

- **Fix-and-compare ("diff") mode.** Re-run after you change a screen and show what improved: who now reaches the end, which frictions cleared, which remain. Turns Setu from a one-shot audit into a loop you design against.

- **Sharper drop-off analytics.** Aggregate across runs — which constraint (language, connection, payment fear, proxy use) costs you the most reach — so a team can prioritise by *who they're losing*, not just *what broke*.

---

## Sharing & teams

- **Shareable report links.** Persist the report chat to the DB (it's `localStorage`-only today) so a report — and the conversation about it — can be shared with a colleague or stakeholder by link.

- **Workspaces & run history.** A home for a team's past runs, so you can watch a product get more inclusive release over release.

---

## More coverage

- **More sample flows** across public-service categories — ration/PDS, Ayushman health insurance, job/gig onboarding, railway/bus booking — so the "no screenshots handy" path covers whatever a first-time visitor most wants to try.

---

## What won't change

The roadmap adds surface area; it does not touch the core. **Drop-off stays real** (personas can quit), and **load times stay computed, never generated.** Those two are the reason Setu is a measurement tool and not a plausible-sounding chat prompt — everything above is built around them, never over them.
