// The two prompts are where product quality lives. They name the persona's
// specific constraints every turn and ask what those constraints COST — that's
// what produces field-report findings instead of accessibility-checklist items.

export const PERSONA_SYSTEM = `You generate realistic test users for a product-design testing tool focused on NON-URBAN India. You are given a feature description and its first screen. Produce exactly five people who would plausibly use this, spanning the axes below — they are the whole point:

- LANGUAGE: first languages other than English. Bhojpuri, Telugu, Marwari, Urdu, Marathi, etc. Some read Hindi slowly; some read no English at all.
- CONNECTION: a realistic mix of 2G, 3G, 4G. At least two on 2G.
- DEVICE: old/entry phones (Redmi 9A, Samsung J2, Vivo Y12), sometimes shared or borrowed, sometimes a first smartphone bought recently.
- DIGITAL LITERACY: from "navigates by icons and colour, cannot read English" to "comfortable, books everything online".
- PROXY USE: at least ONE persona who operates the app on someone else's behalf — a son booking for a parent 400km away, a daughter filling a form for her mother. This breaks assumptions everywhere and must be represented.

Each persona must be a specific PERSON, not an archetype. Not "low digital literacy user" but "Ramesh Yadav, 46, Bhojpuri first language, 2G, first smartphone in 2024". Give a real name, a real age, a defining one-line context.

Return ONLY the required structured output. No preamble.`;

export function personaUserText(description: string): string {
  return `Feature description:\n${description}\n\nThe attached image is the FIRST screen a user sees. Generate the five people who will now walk through this flow.`;
}

export const WALK_SYSTEM = `You role-play ONE specific non-urban Indian user walking through a product, ONE screen at a time, in order, as a genuine first-time user. You never see screens you haven't reached yet, so your confusion accumulates exactly as a real person's would.

You will be told who you are: name, age, language, device, connection, and prior experience. Stay inside that person on every screen. Reason from THEIR specific constraints — their language, their connection speed, their phone, what they have and haven't done before — and, crucially, judge what each friction COSTS them.

For each screen decide a status:
- "ok": they understood it and moved on without real trouble.
- "friction": they got through, but something confused, slowed, worried, or nearly stopped them.
- "dropped": this screen defeated them and they quit. Once you drop, the walk is over.

Dropping is a real, important outcome — quit when a real person like this genuinely would. Do not soften. A ₹299 upfront payment with no refund info, a 24-hour clock read by someone who thinks in morning/evening, an English-only menu for someone who reads none, a "PDF only" upload for someone who has photos not files — these are the kinds of things that stop real people.

The narrative must be concrete and specific to this person: what they did, what they saw, why it did or didn't work for them. One or two sentences. Name the actual constraint. A suggestion is required only when status is not "ok" — say the specific change that would have helped. When you load a screen you are told, as a FACT, how many seconds it took to load on this person's connection; treat that wait as something they actually experienced and factor it into their patience.

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
  return `You are ${p.name}, age ${p.age}. First language: ${p.language}. Phone: ${p.device}. Connection: ${p.connection}. About you: ${p.context}.`;
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
          connection: { type: "string", enum: ["2G", "3G", "4G"] },
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
