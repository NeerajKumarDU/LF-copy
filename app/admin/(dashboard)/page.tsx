import Link from "next/link";
import { Pencil, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { getAdminPosts } from "@/lib/admin-posts";
import { getCurrentSessionUser } from "@/lib/adminAuth";
import { DeleteArticleButton } from "@/components/admin/DeleteArticleButton";
import { pageWindow } from "@/components/ui/PaginationNav";

const STATUS_STYLES: Record<string, string> = {
  published: "bg-emerald-100 text-emerald-700",
  draft: "bg-amber-100 text-amber-700",
  private: "bg-slate-200 text-slate-600",
};

export const dynamic = "force-dynamic";

export default async function AdminArticlesPage({ searchParams }: { searchParams: { page?: string } }) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  const user = await getCurrentSessionUser();
  const isAuthor = user?.role === "author";
  const authorIdFilter = isAuthor ? user?.authorId : undefined;

  const { posts, totalPages, total } = await getAdminPosts(page, authorIdFilter);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-serif text-xl font-bold text-slate-900">
            {isAuthor ? "My Articles" : "Articles"}
          </h1>
          {isAuthor && (
            <p className="text-xs text-slate-500 mt-0.5">
              Articles created by <strong className="text-slate-700">{user?.authorName}</strong>
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">{total} total</span>
          <Link
            href="/admin/new"
            className="bg-crimson-800 hover:bg-crimson-700 text-white text-xs font-bold px-3 py-1.5 rounded transition-colors"
          >
            + New Article
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3 font-bold">Title</th>
                <th className="px-4 py-3 font-bold">Category</th>
                <th className="px-4 py-3 font-bold">Author</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Updated</th>
                <th className="px-4 py-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-900 max-w-md truncate">
                    <Link
                      href={`/admin/edit/${p.id}`}
                      className="hover:text-crimson-800 hover:underline"
                      title="Edit article"
                    >
                      {p.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.categoryName ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{p.authorName}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${STATUS_STYLES[p.status] ?? ""}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {new Date(p.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {p.status === "published" && p.categorySlug && (
                        <Link
                          href={`/${p.categorySlug}/${p.slug}`}
                          target="_blank"
                          title="View live article"
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span className="sr-only">View</span>
                        </Link>
                      )}
                      <Link
                        href={`/admin/edit/${p.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded transition-colors"
                        title="Edit article"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Edit</span>
                      </Link>
                      <DeleteArticleButton id={p.id} title={p.title} variant="icon" />
                    </div>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    {isAuthor ? "You haven't created any articles yet." : "No articles yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col items-center gap-2 mt-4">
          <nav aria-label="Article pages" className="flex items-center justify-center gap-1.5">
            <Link
              href={`/admin?page=${page - 1}`}
              aria-disabled={page <= 1}
              aria-label="Previous page"
              className={`p-2 rounded-md border border-slate-300 text-slate-600 ${page <= 1 ? "pointer-events-none opacity-40" : "hover:border-crimson-700 hover:text-crimson-800"}`}
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>

            {pageWindow(page, totalPages).map((p, i) =>
              p === "…" ? (
                <span key={`gap-${i}`} className="px-2 text-slate-400 text-sm select-none">
                  …
                </span>
              ) : (
                <Link
                  key={p}
                  href={`/admin?page=${p}`}
                  aria-current={p === page ? "page" : undefined}
                  className={`min-w-[2.25rem] h-9 px-2 rounded-md text-xs font-bold flex items-center justify-center transition-colors ${
                    p === page
                      ? "bg-crimson-800 text-white"
                      : "border border-slate-300 text-slate-700 hover:border-crimson-700 hover:text-crimson-800"
                  }`}
                >
                  {p}
                </Link>
              )
            )}

            <Link
              href={`/admin?page=${page + 1}`}
              aria-disabled={page >= totalPages}
              aria-label="Next page"
              className={`p-2 rounded-md border border-slate-300 text-slate-600 ${page >= totalPages ? "pointer-events-none opacity-40" : "hover:border-crimson-700 hover:text-crimson-800"}`}
            >
              <ChevronRight className="w-4 h-4" />
            </Link>
          </nav>
          <span className="text-[11px] text-slate-400 font-mono">
            Page {page} of {totalPages}
          </span>
        </div>
      )}
    </div>
  );
}
