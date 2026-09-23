"use client";

import { useRouter } from "next/navigation";

export function LogoutButton({ redirectTo = "/admin/login" }: { redirectTo?: string }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <button onClick={handleLogout} className="text-xs font-semibold text-slate-300 hover:text-white transition-colors">
      Log Out
    </button>
  );
}
