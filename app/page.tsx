import Link from "next/link";

const CORAL = "#e8704e";

// A framed, slightly-rotated illustration (paper border + soft shadow).
function Frame({
  src,
  w,
  r,
  style,
  className = "",
}: {
  src: string;
  w: number;
  r: number;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <div className={`absolute ${className}`} style={{ ...style, width: w, transform: `rotate(${r}deg)` }} aria-hidden>
      <div
        className="border-[6px] border-[#FCF8EF] bg-[#FCF8EF]"
        style={{ filter: "url(#deckle) drop-shadow(0 11px 22px rgba(34,29,20,0.18))" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="block w-full object-cover" />
      </div>
    </div>
  );
}

// Same illustration, inline (for the mobile strip).
function Strip({ src }: { src: string }) {
  return (
    <div
      className="aspect-[4/5] w-24 shrink-0 border-[5px] border-[#FCF8EF] bg-[#FCF8EF]"
      style={{ filter: "url(#deckle) drop-shadow(0 8px 16px rgba(34,29,20,0.16))" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="block h-full w-full object-cover" />
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      {/* Torn-paper / deckle edge for illustration frames */}
      <svg width="0" height="0" className="absolute" aria-hidden focusable="false">
        <filter id="deckle" x="-18%" y="-18%" width="136%" height="136%">
          <feTurbulence type="fractalNoise" baseFrequency="0.009 0.011" numOctaves="3" seed="8" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="14" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      {/* ── Minimal top bar (the wordmark below is the brand) ── */}
      <nav className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-6xl items-center justify-end gap-5 px-6 py-4 text-[13px] font-dm">
          <Link href="/runs/demo" className="hidden text-ink-soft transition-colors hover:text-ink sm:inline">
            Sample report
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-line bg-card/70 px-3.5 py-1.5 backdrop-blur-sm transition-colors hover:border-ink-soft"
          >
            Sign in
          </Link>
        </div>
      </nav>

      {/* ── Hero: illustration collage + wordmark + tagline ── */}
      <section className="relative overflow-hidden">
        <div className="relative mx-auto min-h-[36rem] max-w-6xl px-6 pb-8 pt-24 sm:min-h-[40rem] sm:pt-28 lg:min-h-[42rem]">
          {/* Desktop collage — overlapping torn-paper pairs flanking the column */}
          <div className="pointer-events-none absolute inset-0 hidden select-none lg:block">
            {/* Top-left pair */}
            <Frame src="/il/h1.webp" w={160} r={-6} style={{ left: "2%", top: "36px" }} className="rise" />
            <Frame src="/il/h2.webp" w={146} r={5} style={{ left: "10%", top: "205px" }} className="rise" />
            {/* Mid-left pair */}
            <Frame src="/il/h5.webp" w={135} r={-8} style={{ left: "3%", top: "330px" }} className="rise" />
            <Frame src="/il/h6.webp" w={160} r={3} style={{ left: "11%", top: "440px" }} className="rise" />
            {/* Top-right pair */}
            <Frame src="/il/h4.webp" w={162} r={-5} style={{ right: "8%", top: "150px" }} className="rise" />
            <Frame src="/il/h3.webp" w={148} r={6} style={{ right: "2%", top: "245px" }} className="rise" />
            {/* Lower-right single */}
            <Frame src="/il/h7.webp" w={158} r={4} style={{ right: "4%", top: "430px" }} className="rise" />
          </div>

          {/* Center column */}
          <div className="relative z-10 mx-auto max-w-xl text-center">
            <p className="rise font-dm text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-soft">
              AI user testing for non-urban India
            </p>
            <p
              className="rise mt-3 font-wordmark text-[68px] italic leading-none sm:text-[92px]"
              style={{ color: CORAL, animationDelay: "60ms" }}
            >
              Setu <span className="font-dm text-[15px] not-italic tracking-normal text-ink-soft">सेतु</span>
            </p>
            <p
              className="rise mx-auto mt-8 max-w-md font-serifd text-[26px] leading-[1.25] text-ink sm:text-[32px]"
              style={{ animationDelay: "120ms" }}
            >
              Setu helps you bridge the gap between your product and{" "}
              <span className="italic" style={{ color: CORAL }}>
                Non-Urban India.
              </span>
            </p>

            <div className="rise mt-9 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: "180ms" }}>
              <Link
                href="/runs/new"
                className="rounded-full bg-ink px-6 py-3 text-[15px] font-medium text-paper transition-colors hover:bg-terra-deep"
              >
                Test your flow
              </Link>
              <Link
                href="/runs/demo"
                className="rounded-full border border-line bg-card px-6 py-3 text-[15px] font-medium transition-colors hover:border-ink-soft"
              >
                Read a sample report
              </Link>
            </div>

            {/* Mobile illustration strip */}
            <div className="mt-10 flex justify-center gap-3 overflow-hidden lg:hidden">
              <Strip src="/il/h1.webp" />
              <Strip src="/il/h3.webp" />
              <Strip src="/il/h6.webp" />
              <Strip src="/il/h7.webp" />
            </div>

            {/* Flow arrow */}
            <div className="mt-10 flex justify-center">
              <svg width="16" height="60" viewBox="0 0 16 60" fill="none" className="text-ink-soft/70" aria-hidden>
                <line x1="8" y1="0" x2="8" y2="52" stroke="currentColor" strokeWidth="1.4" />
                <path d="M2 46 L8 58 L14 46" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section>
        <div className="mx-auto max-w-5xl px-6 pb-8 pt-6">
          <h2 className="text-center font-serifd text-[30px] italic text-ink sm:text-[36px]">How it works?</h2>

          <div className="mt-16 grid gap-14 sm:grid-cols-3 sm:gap-8">
            {/* 1 — upload */}
            <div className="flex flex-col items-center text-center">
              <div className="flex h-36 items-center">
                <div className="flex h-[9.5rem] w-[6.5rem] rotate-[-5deg] items-center justify-center rounded-[18px] border border-dashed border-[#ff5700]/60 bg-[#fe9c7c]/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/il/upload.svg" alt="" className="h-7 w-7 opacity-70" />
                </div>
              </div>
              <p className="mt-6 max-w-[15rem] font-dm text-[15px] leading-relaxed text-ink">
                Upload your app screenshots, in the order a citizen meets them.
              </p>
            </div>

            {/* 2 — personas */}
            <div className="flex flex-col items-center text-center">
              <div className="flex h-36 items-center">
                <div className="flex -space-x-3">
                  {["f1", "f2", "f3", "f4"].map((f, i) => (
                    <span
                      key={f}
                      className="h-16 w-16 overflow-hidden rounded-full border-[3px] border-paper shadow-sm"
                      style={{ zIndex: 4 - i }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/il/${f}.webp`} alt="" className="h-full w-full object-cover" />
                    </span>
                  ))}
                </div>
              </div>
              <p className="mt-6 max-w-[19rem] font-dm text-[15px] leading-relaxed text-ink">
                AI personas grounded in non-urban India — with 20+ variables like education, language
                and network — walk through your screens, one by one.
              </p>
            </div>

            {/* 3 — report */}
            <div className="flex flex-col items-center text-center">
              <div className="flex h-36 items-center">
                <div className="w-28 rotate-[4deg] rounded-lg border border-line bg-card p-2.5 shadow-[0_8px_20px_rgba(34,29,20,0.1)]">
                  <div className="flex items-center gap-1.5">
                    <span className="h-4 w-4 rounded-full bg-ok-tint" />
                    <span className="h-1.5 w-9 rounded bg-line" />
                    <span className="ml-auto h-2.5 w-6 rounded-full bg-bad-tint" />
                  </div>
                  <div className="mt-2 space-y-1">
                    <span className="block h-1.5 w-full rounded bg-line" />
                    <span className="block h-1.5 w-4/5 rounded bg-line" />
                  </div>
                  <div className="mt-2 h-4 rounded bg-terra-tint" />
                </div>
              </div>
              <p className="mt-6 max-w-[16rem] font-dm text-[15px] leading-relaxed text-ink">
                A field report: who got stuck, on which screen, where they dropped off — and much more.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── The report peek (live card) ── */}
      <section>
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
          <h2 className="mx-auto max-w-2xl text-center font-serifd text-[28px] italic leading-[1.25] text-ink sm:text-[34px]">
            You don&apos;t get a score. You get a person — and the moment they gave up.
          </h2>

          <div className="relative mx-auto mt-14 max-w-2xl">
            <div className="pointer-events-none absolute -right-3 -top-7 z-10 rotate-[-8deg] select-none rounded-md border-2 px-3 py-1.5 text-center sm:-right-6" style={{ borderColor: `${CORAL}66` }}>
              <p className="font-dm text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: `${CORAL}cc` }}>
                Field report
              </p>
              <p className="font-serifd text-lg leading-none" style={{ color: `${CORAL}88` }}>
                № 01
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-line bg-card shadow-[0_2px_12px_rgba(34,29,20,0.06)]">
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

            <p className="mt-6 text-center font-dm text-[13.5px] text-ink-soft">
              That&apos;s not an accessibility checklist item. That&apos;s a citizen locked out of care.
            </p>
          </div>
        </div>
      </section>

      {/* ── The honest part (back cover) ── */}
      <section className="bg-ink text-paper">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center sm:py-24">
          <p className="font-dm text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: CORAL }}>
            The honest part
          </p>
          <h2 className="mt-5 font-serifd text-[30px] leading-tight sm:text-[38px]">
            This does not replace going to the village and watching someone use your app.
          </h2>
          <p className="mx-auto mt-5 max-w-xl font-dm text-[16px] leading-relaxed text-paper/70">
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

      {/* ── Footer ── */}
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-wordmark text-2xl italic" style={{ color: CORAL }}>
            Setu <span className="align-middle font-dm text-xs not-italic text-ink-soft">सेतु</span>
          </span>
          <p className="max-w-xl font-dm text-[12.5px] leading-relaxed text-ink-soft">
            Built for the BestPossible.AI hackathon, on the <em>Rural AI User Testing</em> idea. A
            bridge between the people who build India&apos;s public services and the people they&apos;re for.
          </p>
        </div>
      </footer>
    </main>
  );
}
