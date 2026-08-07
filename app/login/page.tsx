import Link from "next/link";
import { redirect } from "next/navigation";
import LoginForm from "@/components/login-form";
import { supabaseServer } from "@/lib/supabase/server";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const next = searchParams.next?.startsWith("/") ? searchParams.next : "/runs/new";

  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect(next);

  return (
    <main>
      <nav className="border-b border-line">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="font-display text-lg font-semibold tracking-tight">
            Doosri Nazar <span className="ml-1 text-sm font-normal text-ink-soft">दूसरी नज़र</span>
          </Link>
        </div>
      </nav>
      <div className="mx-auto w-full max-w-md px-4 pb-24 sm:px-6">
        <header className="pb-8 pt-10 sm:pt-14">
          <p className="mb-2 font-display text-[11px] font-semibold uppercase tracking-[0.18em] text-terra">
            Sign in
          </p>
          <h1 className="font-display text-3xl font-semibold leading-tight">Who&apos;s asking?</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
            Runs are saved to your account so you can share and revisit them.
          </p>
        </header>
        <LoginForm next={next} />
      </div>
    </main>
  );
}
