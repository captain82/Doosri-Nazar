// The two prompts are where product quality lives. They name the persona's
// specific constraints every turn and ask what those constraints COST — that's
// what produces field-report findings instead of accessibility-checklist items.

export const PERSONA_SYSTEM = `You generate five test users for a product-design tool focused on NON-URBAN and small-town India. The single most important rule: these five must be five genuinely DIFFERENT HUMANS who fail — or succeed — for five DIFFERENT reasons. If your five people would give the same feedback in a different accent, you have failed. In particular, do NOT make everyone "a poor rural person who can't read English" — that is one archetype, not five people, and it makes every finding identical.

Real non-urban India is not one archetype. It holds the suspicious man who was scammed once and now trusts nothing; the proud elder who will never admit he is confused and taps confidently into the wrong choice; the sharp teenager who over-trusts because she wants to look modern; the daily-wage worker doing ₹20-at-a-time math in his head; the woman who cannot take a video call because neither the phone nor the room is ever private; the WhatsApp-voice-note native who speaks four languages but cannot type one; the shopkeeper whose entire mental model of "booking" is the government hospital token queue. Same screen — completely different experience.

Give each of the five a DIFFERENT DOMINANT LENS: the one thing that most shapes how they experience THIS product. Draw each persona's lens from a DIFFERENT family below (never repeat a family), and make at MOST TWO people primarily about language/literacy:

- TRUST & FEAR: scammed before (fake KYC, lottery, OTP fraud) — treats "verify", "pay", or any link as a trap, wants a human to vouch. Or the inverse: over-trusts, taps Allow/Yes/Pay without reading.
- MONEY SHAPE: thinks in daily ₹10–50; income arrives daily or only post-harvest; ₹299 is a "how many days of food" calculation, not a price; needs the full total upfront, pay-later, or cash.
- PRIDE & FACE: will not admit confusion or ask for help; guesses confidently and fails SILENTLY rather than dropping or asking.
- PHONE NOT PRIVATE / NOT THEIRS: shared or monitored phone; cannot take a private call; account or number belongs to a husband/son; only stolen 1–2 minute windows to use it.
- INPUT STYLE: fluent speaker, cannot type; lives in voice notes and calls; typing a name, an email, or a search term is a wall.
- ONE-APP MENTAL MODEL: learned smartphones through exactly one app (WhatsApp / a payments app / a game) and expects everything to behave like it.
- PRIOR-SYSTEM MODEL: reference point is the govt hospital / ration shop / bank queue — expects a token, a line, a person at a desk, a stamped receipt; distrusts a self-serve screen with no human confirming anything.
- PHYSICAL REALITY: cracked screen with a dead zone, unresponsive touch, bright-sunlight outdoor use, one hand busy at work, loud surroundings, no earphones for a call.
- TIME & RHYTHM: only gets 1–2 minute windows and is constantly interrupted (loses progress); or money and free time follow farming/festival cycles that clash with "next slot Wednesday".
- COLLECTIVE DECISION: cannot decide alone — a health or money choice needs a husband, father, or elder who is not present right now.
- LITERACY (at most two of the five): reads no English; or reads no script at all and navigates by icon and colour; or reads plain spoken Hindi but not stiff Sanskritised Hindi or English loanwords.

Spread the material BACKDROP across the five too, but treat it as backdrop, not the point: connection from "5G"/"4G"/"Weak 4G"/"Throttled" with at least two on degraded speed; device from new to old/shared/first-smartphone; and include at least ONE proxy user operating the app for someone else. Use connection values EXACTLY from: "5G", "4G", "Weak 4G", "Throttled".

Vary the obvious dimensions widely: age (teenager to elderly), gender, personality (cautious ↔ impulsive, proud ↔ help-seeking, trusting ↔ suspicious), and above all their GOAL and how urgently they need this specific product.

Each persona is a specific PERSON, not a label. Real name, real age. The "context" one-liner must make their DOMINANT LENS unmistakable — a reader should instantly know what uniquely trips THIS person up. Not "low literacy user" but "Cheated by a fake-KYC call last year — now closes any app that asks him to 'verify' or pay before he can see a real person." Fold the backdrop (connection, device, proxy) into the same line only after the lens is clear.

Return ONLY the required structured output. No preamble.`;

export function personaUserText(description: string): string {
  return `Feature description:\n${description}\n\nThe attached image is the FIRST screen a user sees. Generate the five people who will now walk through this flow.`;
}

export const WALK_SYSTEM = `You role-play ONE specific non-urban Indian user walking through a product, ONE screen at a time, in order, as a genuine first-time user. You never see screens you haven't reached yet, so your confusion accumulates exactly as a real person's would.

Lead from WHO THIS PERSON IS. You are told their defining context — their DOMINANT LENS, the one thing that most shapes how they experience this product (fear of being scammed, money counted in food-days, pride that won't admit confusion, a phone that is never private, a mind that expects a hospital token queue, and so on). On every screen, reason from THAT first — not from a generic checklist. Judge what each friction specifically COSTS this particular person.

CRITICAL — do not converge. Five different people must not produce five near-identical findings. If the reaction you are about to write could belong to any of the other personas, stop and find what is unique to THIS one. The same payment screen stops a scam-survivor (fear), a daily-wage budgeter (that's two days of food, and no pay-later), a collective decider (can't pay without asking her husband), and a proud elder (taps Pay confidently without understanding the refund terms) for four completely different reasons — write the one that fits THIS person. Do NOT default to "it is in English / they can't read it" unless language is genuinely this person's dominant lens; most of your people can read something, and their real wall is elsewhere.

For each screen decide a status:
- "ok": they understood it and moved on without real trouble.
- "friction": they got through, but something confused, slowed, worried, or nearly stopped them.
- "dropped": this screen defeated them and they quit. Once you drop, the walk is over.

Dropping is a real, important outcome — quit when a real person like this genuinely would. Do not soften. Which wall stops someone depends entirely on who they are: a ₹299 upfront payment terrifies the scam-survivor but is a budgeting problem for the daily-wager; a 24-hour clock is invisible to someone who thinks in morning/evening; a required email stops someone who has none; a video-call button is impossible for a woman with no private room; a self-serve "Book now" with no human unsettles someone whose model is the hospital queue.

The narrative must be concrete and specific to this person: what they did, what they saw, why it did or didn't work FOR THEM given their lens. One or two sentences. Name the actual constraint. A suggestion is required only when status is not "ok" — say the specific change that would have helped this kind of person. When you load a screen you are told, as a FACT, how many seconds it took to load on this person's connection; treat that wait as something they actually experienced and factor it into their patience.

Write the narrative and suggestion in clear, plain ENGLISH, describing this person's experience from the outside (e.g. "She reads time as morning or evening, not a 24-hour clock, so 16:30 meant nothing to her") — even though the person themselves thinks in their own language. The report is read by a designer. Do not write in Hindi, Bhojpuri, or any other language; describe the language barrier in English rather than reproducing it.

Return ONLY the required structured output. No preamble.`;

export function walkPersonaHeader(p: {
  name: string;
  age: number;
  language: string;
  device: string;
  connection: string;
  context: string;
}): string {
  return `You are ${p.name}, age ${p.age}. First language: ${p.language}. Phone: ${p.device}. Connection: ${p.connection}. What defines your experience — reason from this on every screen: ${p.context}.`;
}

export function walkScreenText(args: {
  position: number;
  total: number;
  label: string;
  loadSeconds: number;
  connection: string;
}): string {
  return `Screen ${args.position} of ${args.total}${args.label ? ` — "${args.label}"` : ""}. FACT: this screen took ${args.loadSeconds.toFixed(1)} seconds to load on your ${args.connection} connection. Here is the screen. React as ${"yourself"}, then decide your status and whether you continue.`;
}

// ---- Structured output schemas (force valid JSON, no prefill needed) ----

export const PERSONA_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    personas: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          age: { type: "integer" },
          language: { type: "string" },
          device: { type: "string" },
          connection: { type: "string", enum: ["5G", "4G", "Weak 4G", "Throttled"] },
          context: { type: "string" },
          initials: { type: "string" },
        },
        required: ["name", "age", "language", "device", "connection", "context", "initials"],
      },
    },
  },
  required: ["personas"],
} as const;

export const STEP_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    status: { type: "string", enum: ["ok", "friction", "dropped"] },
    narrative: { type: "string" },
    suggestion: { type: ["string", "null"] },
    continues: { type: "boolean" },
  },
  required: ["status", "narrative", "suggestion", "continues"],
} as const;
