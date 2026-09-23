import Link from "next/link";
import { Scale, Shield, UserPen } from "lucide-react";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { ChangePasswordModal } from "@/components/admin/ChangePasswordModal";
import { getCurrentSessionUser } from "@/lib/adminAuth";
import { listPendingAuthorRequests } from "@/lib/author-requests";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentSessionUser();
  const isAdmin = user?.role === "admin";
  const isAuthor = user?.role === "author";
  const pendingRequestCount = isAdmin ? (await listPendingAuthorRequests()).length : 0;

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <header className="bg-slate-950 text-white px-6 py-3.5 flex items-center justify-end">

        <div className="flex items-center gap-3">
          {isAuthor && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-300 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded">
                <UserPen className="w-3.5 h-3.5 text-crimson-400" />
                <span>Author: <strong className="text-white">{user.authorName}</strong></span>
              </span>
              <ChangePasswordModal />
            </div>
          )}

          {isAdmin && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded">
              <Shield className="w-3.5 h-3.5" />
              <span>Administrator</span>
            </span>
          )}

          <LogoutButton redirectTo={isAuthor ? "/author/login" : "/admin/login"} />
        </div>
      </header>

      <nav className="bg-white border-b border-slate-200 px-6 flex gap-6">
        <Link
          href="/admin"
          className="py-3 text-sm font-bold text-slate-700 hover:text-crimson-800 border-b-2 border-transparent hover:border-crimson-700 transition-colors"
        >
          {isAuthor ? "My Articles" : "Articles"}
        </Link>
        <Link
          href="/admin/new"
          className="py-3 text-sm font-bold text-slate-700 hover:text-crimson-800 border-b-2 border-transparent hover:border-crimson-700 transition-colors"
        >
          New Article
        </Link>
        {isAdmin && (
          <Link
            href="/admin/authors"
            className="py-3 text-sm font-bold text-slate-700 hover:text-crimson-800 border-b-2 border-transparent hover:border-crimson-700 transition-colors"
          >
            Authors & Passwords
          </Link>
        )}
        {isAdmin && (
          <Link
            href="/admin/author-requests"
            className="py-3 text-sm font-bold text-slate-700 hover:text-crimson-800 border-b-2 border-transparent hover:border-crimson-700 transition-colors inline-flex items-center gap-1.5"
          >
            <span>Author Requests</span>
            {pendingRequestCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 text-[11px] font-bold text-white bg-crimson-700 rounded-full">
                {pendingRequestCount}
              </span>
            )}
          </Link>
        )}
      </nav>

      <main className="p-6 max-w-6xl mx-auto">{children}</main>
    </div>
  );
}
