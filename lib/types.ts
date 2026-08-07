export type RunStatus = "pending" | "generating" | "walking" | "done" | "error";
export type Outcome = "completed" | "struggled" | "dropped";
export type StepStatus = "ok" | "friction" | "dropped";
export type Connection = "2G" | "3G" | "4G";

export interface Screen {
  id: string;
  position: number;
  label: string;
  storage_path: string | null;
  width: number;
  height: number;
  bytes: number;
}

export interface Step {
  id: string;
  screen_id: string;
  position: number;
  status: StepStatus;
  narrative: string;
  suggestion: string | null;
  metrics: { load_seconds?: number };
}

export interface Persona {
  id: string;
  name: string;
  age: number;
  language: string;
  device: string;
  connection: Connection;
  context: string;
  initials: string;
  outcome: Outcome;
  dropped_at_screen: number | null;
  steps: Step[];
}

export interface RunReport {
  id: string;
  title: string;
  description: string;
  status: RunStatus;
  created_at: string;
  screens: Screen[];
  personas: Persona[];
}
