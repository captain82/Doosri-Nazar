import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ResultsView from "@/components/results-view";
import RunOrchestrator from "@/components/run-orchestrator";
import { FAKE_REPORT } from "@/lib/fake-run";
import { fetchRunReport } from "@/lib/queries";
import { supabaseServer } from "@/lib/supabase/server";
import type { Persona, RunReport } from "@/lib/types";

const runComplete = (r: RunReport) =>
  r.status === "done" ||
  (r.personas.length > 0 &&
    r.personas.every((p: Persona) => p.outcome != null && p.steps.length > 0));

export default async function RunPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { view?: string };
}) {
  const isDemo = params.id === "demo";
  let report: RunReport;

  if (isDemo) {
    report = FAKE_REPORT;
  } else {
    const supabase = supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect(`/login?next=/runs/${params.id}`);
    const fetched = await fetchRunReport(supabase, params.id);
    if (!fetched) notFound();
    report = fetched;
  }

  const initialView = searchParams.view === "screen" ? "screen" : "user";
  const running = !isDemo && report.status !== "error" && !runComplete(report);

  return (
    <main>
      <nav className="border-b border-line">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="font-display text-lg font-semibold tracking-tight">
            Doosri Nazar <span className="ml-1 text-sm font-normal text-ink-soft">दूसरी नज़र</span>
          </Link>
          {isDemo ? (
            <span className="rounded-full border border-line px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-ink-soft">
              Sample report
            </span>
          ) : (
            <Link href="/runs/new" className="text-[13px] text-ink-soft hover:text-ink">
              New run
            </Link>
          )}
        </div>
      </nav>
      {running ? (
        <RunOrchestrator initial={report} />
      ) : (
        <ResultsView report={report} initialView={initialView} />
      )}
    </main>
  );
}
