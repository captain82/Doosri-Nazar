import Link from "next/link";
import ResultsView from "@/components/results-view";
import { FAKE_REPORT } from "@/lib/fake-run";

export default function RunPage({
  searchParams,
}: {
  searchParams: { view?: string };
}) {
  // route param becomes the fetch key once the real pipeline exists
  const report = FAKE_REPORT;
  const initialView = searchParams.view === "screen" ? "screen" : "user";

  return (
    <main>
      <nav className="border-b border-line">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="font-display text-lg font-semibold tracking-tight">
            Doosri Nazar <span className="ml-1 text-sm font-normal text-ink-soft">दूसरी नज़र</span>
          </Link>
          <span className="rounded-full border border-line px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-ink-soft">
            Sample report
          </span>
        </div>
      </nav>
      <ResultsView report={report} initialView={initialView} />
    </main>
  );
}
