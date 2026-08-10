import Link from "next/link";
import { redirect } from "next/navigation";
import NewRunForm from "@/components/new-run-form";
import UserChip from "@/components/user-chip";
import { supabaseServer } from "@/lib/supabase/server";

export default async function NewRunPage() {
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/runs/new");

  return (
    <main>
      <nav className="border-b border-line">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="font-display text-lg font-semibold tracking-tight">
            Setu <span className="ml-1 text-sm font-normal text-ink-soft">सेतु</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/runs/demo" className="text-[13px] text-ink-soft hover:text-ink">
              Sample report
            </Link>
            <UserChip email={user.email ?? ""} />
          </div>
        </div>
      </nav>

      <div className="mx-auto w-full max-w-3xl px-4 pb-24 sm:px-6">
        <header className="pb-8 pt-10 sm:pt-14">
          <p className="mb-2 font-display text-[11px] font-semibold uppercase tracking-[0.18em] text-terra">
            New run
          </p>
          <h1 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
            Show us the flow
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
            Upload the screens in the order a user meets them. Five AI users from non-urban India
            will walk through, on their phones, their connections, in their languages, and
            report back.
          </p>
        </header>
        <NewRunForm />
      </div>
    </main>
  );
}
