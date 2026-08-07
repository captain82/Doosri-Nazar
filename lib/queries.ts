import type { SupabaseClient } from "@supabase/supabase-js";
import type { Persona, RunReport, Screen, Step } from "./types";

export async function fetchRunReport(
  supabase: SupabaseClient,
  id: string,
): Promise<RunReport | null> {
  const { data, error } = await supabase
    .from("runs")
    .select("*, screens(*), personas(*, steps(*))")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  const screens = (data.screens as Screen[]).sort((a, b) => a.position - b.position);
  const personas = (data.personas as (Persona & { steps: Step[] })[]).map((p) => ({
    ...p,
    // a persona mid-walk has no outcome yet; treat as struggled until final
    outcome: p.outcome ?? "struggled",
    steps: [...p.steps].sort((a, b) => a.position - b.position),
  }));

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    status: data.status,
    created_at: data.created_at,
    screens,
    personas,
  };
}
