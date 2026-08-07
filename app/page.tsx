import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <nav className="border-b border-line">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <span className="font-display text-lg font-semibold tracking-tight">
            Doosri Nazar <span className="ml-1 text-sm font-normal text-ink-soft">दूसरी नज़र</span>
          </span>
        </div>
      </nav>

      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-16 sm:px-6">
        <p className="rise mb-4 font-display text-[11px] font-semibold uppercase tracking-[0.18em] text-terra">
          A second look, before you ship
        </p>
        <h1 className="rise font-display text-4xl font-semibold leading-[1.1] sm:text-6xl" style={{ animationDelay: "60ms" }}>
          Your design works.
          <br />
          <span className="text-terra">For people like you.</span>
        </h1>
        <p className="rise mt-6 max-w-xl text-[16px] leading-relaxed text-ink-soft" style={{ animationDelay: "120ms" }}>
          Most software in India is designed and tested by people with new phones, fast internet
          and good English. Everyone else gets designed out — not deliberately, just invisibly.
          Doosri Nazar walks AI users grounded in non-urban India — 2G connections, first
          smartphones, five languages, borrowed phones — through your screens and shows you
          exactly where they fall off.
        </p>
        <div className="rise mt-8 flex flex-wrap items-center gap-4" style={{ animationDelay: "180ms" }}>
          <Link
            href="/runs/demo"
            className="rounded-full bg-ink px-5 py-2.5 text-[15px] font-medium text-paper transition-colors hover:bg-terra-deep"
          >
            See a sample report →
          </Link>
          <span className="text-[13px] text-ink-soft">Upload your own flow — coming in days</span>
        </div>
      </section>

      <footer className="border-t border-line">
        <p className="mx-auto max-w-3xl px-4 py-4 text-xs text-ink-soft sm:px-6">
          Built for the BestPossible.AI hackathon, on the Rural AI User Testing idea. Not a
          replacement for field testing — the cheap first pass before it.
        </p>
      </footer>
    </main>
  );
}
