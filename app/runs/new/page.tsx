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
            <UserChip email={user.email ?? ""} />
          </div>
        </div>
      </nav>

      <div className="mx-auto w-full max-w-3xl px-4 pb-24 sm:px-6">
        <header className="pb-7 pt-10 sm:pt-14">
          <h1 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
            Show us the flow
          </h1>
          <p className="mt-2.5 max-w-xl text-[15px] leading-relaxed text-ink-soft">
            Upload your screens in order. Five AI users from non-urban India walk through and report
            where they get stuck.
          </p>
        </header>
        <NewRunForm />
      </div>
    </main>
  );
}
