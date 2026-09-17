import { Search as SearchIcon } from "lucide-react";
import { getPosts, getPostsCount, getCategories } from "@/lib/posts";
import { EditorialSection } from "@/components/home/EditorialSection";
import { EDITORIAL_PAGE_SIZE } from "@/lib/pagination";
import { SidebarWidgets } from "@/components/sidebar/SidebarWidgets";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = (searchParams.q ?? "").trim();
  const [results, resultCount, allPosts, categories] = await Promise.all([
    q ? getPosts({ query: q, limit: EDITORIAL_PAGE_SIZE }) : Promise.resolve([]),
    q ? getPostsCount({ query: q }) : Promise.resolve(0),
    getPosts({ limit: 10 }),
    getCategories(),
  ]);
  const initialTotalPages = Math.max(1, Math.ceil(resultCount / EDITORIAL_PAGE_SIZE));
  const trendingPosts = [...allPosts].sort((a, b) => b.hotScore - a.hotScore);

  return (
    <div className="w-full pb-16 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex items-center gap-2 mb-6">
          <SearchIcon className="w-6 h-6 text-crimson-800" />
          <h1 className="font-serif text-2xl font-bold text-slate-900">
            {q ? <>Search results for &ldquo;{q}&rdquo;</> : "Search"}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            {q && results.length === 0 && (
              <div className="p-8 text-center bg-white rounded-md border border-slate-200">
                <p className="text-slate-500 font-serif">No results found.</p>
              </div>
            )}
            {results.length > 0 && (
              <EditorialSection initialPosts={results} initialTotalPages={initialTotalPages} query={q} />
            )}
          </div>
          <div className="lg:col-span-4">
            <SidebarWidgets trendingPosts={trendingPosts} categories={categories} />
          </div>
        </div>
      </div>
    </div>
  );
}
