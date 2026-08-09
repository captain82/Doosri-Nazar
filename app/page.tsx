import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav className="border-b border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="font-display text-lg font-semibold tracking-tight">
            Doosri Nazar <span className="ml-1 text-sm font-normal text-ink-soft">दूसरी नज़र</span>
          </span>
          <div className="flex items-center gap-5 text-[13px]">
            <Link href="/runs/demo" className="hidden text-ink-soft transition-colors hover:text-ink sm:inline">
              Sample report
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-line px-3.5 py-1.5 transition-colors hover:border-ink-soft"
            >
              Sign in
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* faint ruled margin, like a ledger */}
        <div
          className="pointer-events-none absolute inset-y-0 left-[max(1.5rem,calc(50%-36rem))] hidden w-px bg-terra/20 lg:block"
          aria-hidden
        />
        <div className="mx-auto max-w-6xl px-6 pb-24 pt-20 sm:pt-28">
          <p className="rise font-display text-[11px] font-semibold uppercase tracking-[0.22em] text-terra">
            A second look · दूसरी नज़र
          </p>
          <h1
            className="rise mt-6 max-w-4xl font-display text-[2.6rem] font-semibold leading-[1.04] sm:text-6xl md:text-[4.25rem]"
            style={{ animationDelay: "60ms" }}
          >
            Your service works.
            <br />
            <span className="italic text-terra">For people like you.</span>
          </h1>
          <p
            className="rise mt-8 max-w-2xl text-[17px] leading-relaxed text-ink-soft"
            style={{ animationDelay: "120ms" }}
          >
            Everyone else — the farmer on 2G, the widow on a borrowed phone, the elder who reads no
            English — is quietly designed out of the schemes, clinics and welfare apps built to reach
            them. Not deliberately. Invisibly.
          </p>
          <p
            className="rise mt-4 max-w-2xl text-[17px] leading-relaxed text-ink"
            style={{ animationDelay: "160ms" }}
          >
            Doosri Nazar walks AI users grounded in non-urban India through your screens and shows
            you exactly where they fall off — before it goes live.
          </p>
          <div className="rise mt-9 flex flex-wrap items-center gap-4" style={{ animationDelay: "200ms" }}>
            <Link
              href="/runs/demo"
              className="group rounded-full bg-ink px-6 py-3 text-[15px] font-medium text-paper transition-colors hover:bg-terra-deep"
            >
              Read a sample field report{" "}
              <span className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
            <Link
              href="/runs/new"
              className="rounded-full border border-line bg-card px-6 py-3 text-[15px] font-medium transition-colors hover:border-ink-soft"
            >
              Test your flow
            </Link>
          </div>
          <p
            className="rise mt-10 max-w-xl text-[13px] leading-relaxed text-ink-soft"
            style={{ animationDelay: "240ms" }}
          >
            For the teams building India&apos;s public services — welfare, health, schemes, benefits —
            for people who are nothing like the people who build them.
          </p>
        </div>
      </section>

      {/* ── 01 · The gap ───────────────────────────────────── */}
      <section className="border-t border-line bg-paper-deep/40">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
          <p className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-terra">
            01 · The gap
          </p>
          <h2 className="mt-4 max-w-3xl font-display text-3xl font-semibold leading-tight sm:text-[2.6rem]">
            A public service is built and tested by people nothing like the people it&apos;s for.
          </h2>

          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            <div className="rounded-xl border border-line bg-card p-6 sm:p-7">
              <p className="font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
                Who builds it
              </p>
              <ul className="mt-4 space-y-2.5 text-[15px] leading-relaxed text-ink">
                <li>New phone, fast Wi-Fi, a big bright screen</li>
                <li>Fluent English; reads without thinking</li>
                <li>A bank account, an email, a UPI PIN</li>
                <li>Tests it once, on their own device — and it works</li>
              </ul>
            </div>
            <div className="rounded-xl border border-terra/25 bg-terra-tint/50 p-6 sm:p-7">
              <p className="font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-terra-deep">
                Who it&apos;s for
              </p>
              <ul className="mt-4 space-y-2.5 text-[15px] leading-relaxed text-ink">
                <li>A ₹6,000 subsidy they can&apos;t finish claiming</li>
                <li>A doctor they can&apos;t reach — the call needs a privacy they don&apos;t have</li>
                <li>A ration portal in a language they can&apos;t read</li>
                <li>Data that runs out by evening; a phone shared with the whole family</li>
              </ul>
            </div>
          </div>

          <p className="mt-12 max-w-3xl font-display text-xl italic leading-relaxed text-ink sm:text-2xl">
            &ldquo;Real field testing is the right answer. But it&apos;s slow and expensive — so teams
            skip it, and ship blind.&rdquo;
          </p>
        </div>
      </section>

      {/* ── 02 · How it works ──────────────────────────────── */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
          <p className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-terra">
            02 · How it works
          </p>
          <h2 className="mt-4 max-w-2xl font-display text-3xl font-semibold leading-tight sm:text-[2.6rem]">
            Three steps. About a minute.
          </h2>

          <div className="mt-14 grid gap-10 sm:grid-cols-3 sm:gap-8">
            {[
              {
                n: "01",
                t: "Show us the flow",
                d: "Upload the screens of your service in the order a citizen meets them. A form, a booking, a claim — whatever you're about to ship.",
              },
              {
                n: "02",
                t: "Five real lives walk through",
                d: "AI users grounded in non-urban India — their language, their phone, their throttled data, what they've never done before — move through one screen at a time, never seeing ahead.",
              },
              {
                n: "03",
                t: "See where each fell off",
                d: "A field report: who got stuck, on which screen, what it cost them, and the one change that would have helped. Then ask it anything.",
              },
            ].map((s, i) => (
              <div
                key={s.n}
                className="rise border-t-2 border-ink/80 pt-5"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <p className="font-display text-4xl font-semibold text-terra">{s.n}</p>
                <h3 className="mt-3 font-display text-xl font-semibold">{s.t}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-ink-soft">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 03 · A page from a real report ─────────────────── */}
      <section className="border-t border-line bg-paper-deep/40">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
          <p className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-terra">
            03 · A page from a real report
          </p>
          <h2 className="mt-4 max-w-3xl font-display text-3xl font-semibold leading-tight sm:text-[2.6rem]">
            You don&apos;t get a score. You get a person — and the moment they gave up.
          </h2>

          <div className="relative mx-auto mt-14 max-w-2xl">
            {/* stamp */}
            <div className="pointer-events-none absolute -right-3 -top-7 z-10 rotate-[-8deg] select-none rounded-md border-2 border-terra/40 bg-paper px-3 py-1.5 text-center sm:-right-6">
              <p className="font-display text-[9px] font-bold uppercase tracking-[0.18em] text-terra/80">
                Field report
              </p>
              <p className="font-display text-lg font-semibold leading-none text-terra/50">№ 01</p>
            </div>

            <div className="overflow-hidden rounded-xl border border-line bg-card shadow-[0_2px_12px_rgba(34,29,20,0.06)]">
              {/* mini summary strip */}
              <div className="grid grid-cols-3 divide-x divide-line border-b border-line">
                <div className="px-4 py-3">
                  <p className="font-display text-2xl font-semibold tabular-nums">5</p>
                  <p className="text-[11px] text-ink-soft">users tested</p>
                </div>
                <div className="px-4 py-3">
                  <p className="font-display text-2xl font-semibold tabular-nums text-bad">2 of 5</p>
                  <p className="text-[11px] text-ink-soft">reached the end</p>
                </div>
                <div className="px-4 py-3">
                  <p className="truncate font-display text-lg font-semibold leading-tight">Choose Doctor</p>
                  <p className="text-[11px] text-ink-soft">worst screen</p>
                </div>
              </div>

              {/* one persona finding */}
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ok-tint font-display text-sm font-semibold text-ok">
                    LN
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      Lakshmi Narsamma <span className="text-ink-soft">58</span>
                    </p>
                    <p className="text-[12.5px] text-ink-soft">Telugu only · Throttled · cannot read English</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-bad-tint px-2.5 py-1 text-xs font-medium text-bad">
                    Left at screen 2
                  </span>
                </div>

                <div className="mt-4 flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-bad/30 bg-bad-tint text-xs font-semibold text-bad">
                    2
                  </span>
                  <div className="min-w-0">
                    <p className="font-display text-[11px] font-semibold uppercase tracking-wider text-ink">
                      Choose Doctor{" "}
                      <span className="ml-1 rounded border border-line bg-paper px-1.5 py-0.5 text-[10px] font-normal tabular-nums text-ink-soft">
                        16.0s to load · Throttled
                      </span>
                    </p>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-soft">
                      The doctor list is entirely in English — &ldquo;General Physician&rdquo;,
                      &ldquo;Dermatology&rdquo; — with no Telugu anywhere and no language switch she
                      could find. None of the words meant anything to her. She closed the app and
                      decided to phone her son instead.
                    </p>
                    <div className="mt-2.5 rounded-md border border-terra/20 bg-terra-tint px-3 py-2">
                      <span className="mr-1.5 font-display text-[11px] font-semibold uppercase tracking-wider text-terra-deep">
                        What to change
                      </span>
                      <span className="text-[13px] leading-relaxed text-ink">
                        Ask for language on the first screen; translate specialty names into plain
                        words — &ldquo;skin doctor&rdquo;, not &ldquo;Dermatology&rdquo;.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-6 text-center text-[13px] text-ink-soft">
              That&apos;s not an accessibility checklist item. That&apos;s a citizen locked out of care.
            </p>
          </div>
        </div>
      </section>

      {/* ── The honest part (back cover) ───────────────────── */}
      <section className="bg-ink text-paper">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center sm:py-24">
          <p className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-terra">
            The honest part
          </p>
          <h2 className="mt-5 font-display text-3xl font-semibold leading-tight sm:text-[2.6rem]">
            This does not replace going to the village and watching someone use your app.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-paper/70">
            It&apos;s the cheap first pass. It clears the obvious breaks, so the real field time you
            have is spent on what only real people can tell you.
          </p>
          <Link
            href="/runs/demo"
            className="group mt-9 inline-block rounded-full bg-paper px-6 py-3 text-[15px] font-medium text-ink transition-colors hover:bg-terra-tint"
          >
            Read a sample field report{" "}
            <span className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-display text-sm font-semibold tracking-tight">
            Doosri Nazar <span className="ml-1 font-normal text-ink-soft">दूसरी नज़र</span>
          </span>
          <p className="max-w-xl text-[12.5px] leading-relaxed text-ink-soft">
            Built for the BestPossible.AI hackathon, on the <em>Rural AI User Testing</em> idea. A
            second look at your design — through the eyes of the other India.
          </p>
        </div>
      </footer>
    </main>
  );
}
