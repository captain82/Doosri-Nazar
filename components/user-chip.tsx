"use client";

import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function UserChip({ email }: { email: string }) {
  const router = useRouter();
  const signOut = async () => {
    await supabaseBrowser().auth.signOut();
    router.push("/");
    router.refresh();
  };
  return (
    <span className="flex items-center gap-2 text-[13px] text-ink-soft">
      <span className="hidden max-w-[16ch] truncate sm:block">{email}</span>
      <button onClick={signOut} className="rounded-full border border-line px-2.5 py-1 transition-colors hover:border-ink-soft hover:text-ink">
        Sign out
      </button>
    </span>
  );
}
