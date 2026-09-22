import { redirect } from "next/navigation";
import { getCurrentSessionUser } from "@/lib/adminAuth";
import { listPendingAuthorRequests } from "@/lib/author-requests";
import { AuthorRequestActions } from "@/components/admin/AuthorRequestActions";
import { UserPlus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AuthorRequestsPage() {
  const user = await getCurrentSessionUser();
  if (!user || user.role !== "admin") {
    redirect("/admin");
  }

  const requests = await listPendingAuthorRequests();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-crimson-800" />
          <h1 className="font-serif text-xl font-bold text-slate-900">Author Requests</h1>
        </div>
        <span className="text-xs text-slate-500">{requests.length} pending</span>
      </div>

      <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500 bg-slate-50">
                <th className="px-4 py-3 font-bold">Name</th>
                <th className="px-4 py-3 font-bold">Email</th>
                <th className="px-4 py-3 font-bold">Message</th>
                <th className="px-4 py-3 font-bold">Verified</th>
                <th className="px-4 py-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 align-top">
                  <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">{r.name}</td>
                  <td className="px-4 py-3 text-slate-600 font-mono text-xs">{r.email}</td>
                  <td className="px-4 py-3 text-slate-600 max-w-sm">
                    {r.message || <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                    {r.verifiedAt
                      ? new Date(r.verifiedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <AuthorRequestActions id={r.id} name={r.name} />
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    No pending requests.
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
