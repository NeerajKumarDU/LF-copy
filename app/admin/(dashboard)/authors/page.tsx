import { redirect } from "next/navigation";
import { getCurrentSessionUser } from "@/lib/adminAuth";
import { getAllAuthorsWithAuthStatus } from "@/lib/admin-posts";
import { AdminResetPasswordModal } from "@/components/admin/AdminResetPasswordModal";
import { Users, KeyRound, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminAuthorsPage() {
  const user = await getCurrentSessionUser();
  if (!user || user.role !== "admin") {
    redirect("/admin");
  }

  const authors = await getAllAuthorsWithAuthStatus();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-crimson-800" />
          <h1 className="font-serif text-xl font-bold text-slate-900">Author Management</h1>
        </div>
        <span className="text-xs text-slate-500">{authors.length} authors</span>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-xs text-amber-900 flex items-start gap-2">
        <KeyRound className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Author Passwords</p>
          <p className="mt-0.5 text-amber-800">
            Authors with &ldquo;Default Password&rdquo; use the fallback author password set in your environment variables.
            As an administrator, you can directly set or override any author&apos;s password at any time.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500 bg-slate-50">
                <th className="px-4 py-3 font-bold">Author Name</th>
                <th className="px-4 py-3 font-bold">Slug</th>
                <th className="px-4 py-3 font-bold">Articles</th>
                <th className="px-4 py-3 font-bold">Password Status</th>
                <th className="px-4 py-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {authors.map((a) => (
                <tr key={a.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-900">{a.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{a.slug}</td>
                  <td className="px-4 py-3 text-slate-600">{a.postCount}</td>
                  <td className="px-4 py-3">
                    {a.hasCustomPassword ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Custom Set</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        Default Fallback
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <AdminResetPasswordModal authorId={a.id} authorName={a.name} />
                  </td>
                </tr>
              ))}
              {authors.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    No authors found in database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
