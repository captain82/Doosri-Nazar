import type { Persona, Screen } from "./types";

// Outcome-aware suggested questions for one persona — templated (no model call),
// so they're instant and still feel tailored.
export function userQuestions(p: Persona): string[] {
  const first = p.name.split(" ")[0];
  if (p.outcome === "dropped") {
    return [
      `Why did ${first} leave at screen ${p.dropped_at_screen}?`,
      `What one change would have kept ${first} going?`,
      `Do other users hit the same wall as ${first}?`,
    ];
  }
  if (p.outcome === "struggled") {
    return [
      `What frustrated ${first} the most?`,
      `What should I fix for users like ${first}?`,
      `How close did ${first} come to quitting?`,
    ];
  }
  return [
    `What nearly tripped ${first} up?`,
    `Why did ${first} get through when others didn't?`,
    `Anything worth fixing for users like ${first}?`,
  ];
}

// Suggested questions for one screen, across all users.
export function screenQuestions(s: Screen): string[] {
  const label = s.label || `screen ${s.position}`;
  return [
    `Why did users struggle on "${label}"?`,
    `What's the single most important fix for "${label}"?`,
    `Which users had trouble on "${label}", and why?`,
  ];
}
