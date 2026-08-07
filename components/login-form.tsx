"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function LoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setBusy(false);
    if (error) setError(error.message);
    else setSent(true);
  };

  if (sent) {
    return (
      <div className="rounded-lg border border-ok/30 bg-ok-tint px-4 py-4">
        <p className="font-medium">Check your email</p>
        <p className="mt-1 text-[14px] text-ink-soft">
          A sign-in link is on its way to <span className="font-medium text-ink">{email}</span>.
          Open it on this device and you&apos;ll land right back here.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-2 block font-display text-[11px] font-semibold uppercase tracking-[0.18em] text-ink">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-lg border border-line bg-card px-3.5 py-2.5 text-[15px] outline-none transition-colors placeholder:text-ink-soft/60 focus:border-ink-soft"
        />
      </div>
      {error && (
        <p className="rounded-lg border border-bad/30 bg-bad-tint px-3.5 py-2.5 text-[13px]">{error}</p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-full bg-ink px-6 py-3 text-[15px] font-medium text-paper transition-colors hover:bg-terra-deep disabled:opacity-40"
      >
        {busy ? "Sending…" : "Email me a sign-in link"}
      </button>
      <p className="text-center text-[12px] text-ink-soft">No password, no account setup — the link is the login.</p>
    </form>
  );
}
