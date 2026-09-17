import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { FolderOpen, ChevronRight } from "lucide-react";
import { getCategoryBySlug, getCategories, getPosts, getPostsCount } from "@/lib/posts";
import { SidebarWidgets } from "@/components/sidebar/SidebarWidgets";
import { CategoryPostGrid } from "@/components/category/CategoryPostGrid";
import { CATEGORY_PAGE_SIZE } from "@/lib/pagination";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const category = await getCategoryBySlug(params.slug);
  if (!category) return { title: "Category Not Found" };
  return { title: `${category.name} Archives`, description: category.description };
}

export default async function CategoryArchivePage({ params }: { params: { slug: string } }) {
  const category = await getCategoryBySlug(params.slug);
  if (!category) notFound();

  const [categoryPosts, categoryPostCount, allPosts, categories] = await Promise.all([
    getPosts({ categorySlug: params.slug, limit: CATEGORY_PAGE_SIZE }),
    getPostsCount({ categorySlug: params.slug }),
    getPosts({ limit: 10 }),
    getCategories(),
  ]);
  const initialTotalPages = Math.max(1, Math.ceil(categoryPostCount / CATEGORY_PAGE_SIZE));
  const trendingPosts = [...allPosts].sort((a, b) => b.hotScore - a.hotScore);

  return (
    <div className="w-full pb-16 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <nav className="flex items-center space-x-2 text-xs text-slate-500 py-3 border-b border-slate-200">
          <Link href="/" className="hover:text-crimson-800 transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-700 font-bold">{category.name}</span>
        </nav>

        <div className="my-6 p-6 sm:p-8 bg-slate-900 text-white rounded-md border border-slate-800 shadow-md relative overflow-hidden">
          <div className="relative z-10 max-w-3xl">
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
              <FolderOpen className="w-4 h-4" />
              <span>Category</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-white">{category.name}</h1>
            {category.description && <p className="text-slate-300 text-sm sm:text-base mt-3 leading-relaxed font-serif">{category.description}</p>}
            <div className="mt-4 text-xs font-mono text-slate-400">
              Posts: <span className="text-white font-bold">{categoryPostCount}</span>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-96 h-96 opacity-10 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: category.color }} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <CategoryPostGrid categorySlug={params.slug} initialPosts={categoryPosts} initialTotalPages={initialTotalPages} />
          </div>

          <div className="lg:col-span-4">
            <SidebarWidgets trendingPosts={trendingPosts} categories={categories} />
          </div>
        </div>
      </div>
    </div>
  );
}
