import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Calendar, Eye, FolderOpen, ChevronRight } from "lucide-react";
import { getCategoryBySlug, getCategories, getPosts } from "@/lib/posts";
import { SidebarWidgets } from "@/components/sidebar/SidebarWidgets";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const category = await getCategoryBySlug(params.slug);
  if (!category) return { title: "Category Not Found" };
  return { title: `${category.name} Archives`, description: category.description };
}

export default async function CategoryArchivePage({ params }: { params: { slug: string } }) {
  const category = await getCategoryBySlug(params.slug);
  if (!category) notFound();

  const [categoryPosts, allPosts, categories] = await Promise.all([
    getPosts({ categorySlug: params.slug }),
    getPosts({ limit: 10 }),
    getCategories(),
  ]);
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
              Posts: <span className="text-white font-bold">{categoryPosts.length}</span>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-96 h-96 opacity-10 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: category.color }} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            {categoryPosts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {categoryPosts.map((post) => (
                  <article key={post.id} className="group bg-white rounded-md border border-slate-200 overflow-hidden shadow-sm hover:shadow-md hover:border-crimson-700/40 transition-all flex flex-col justify-between">
                    <div>
                      <div className="relative w-full h-48 bg-slate-900 overflow-hidden">
                        <Image src={post.coverImage} alt={post.title} fill sizes="(max-width: 640px) 100vw, 380px" className="object-cover group-hover:scale-105 transition-transform duration-300" />
                        <span className="absolute top-2 left-2 bg-crimson-800 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow">
                          {post.category.name}
                        </span>
                      </div>

                      <div className="p-4 sm:p-5">
                        <div className="flex items-center space-x-2 text-[11px] text-slate-500 mb-2">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(post.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}</span>
                          <span>•</span>
                          <span>{post.readTimeMin} min read</span>
                        </div>

                        <Link href={`/${post.category.slug}/${post.slug}`}>
                          <h2 className="font-serif text-base sm:text-lg font-bold text-slate-900 group-hover:text-crimson-800 leading-snug line-clamp-2 transition-colors">
                            {post.title}
                          </h2>
                        </Link>

                        <p className="text-slate-600 text-xs mt-2 line-clamp-2 leading-relaxed">{post.excerpt}</p>
                      </div>
                    </div>

                    <div className="p-4 sm:p-5 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between text-xs text-slate-500">
                      <span className="font-semibold text-slate-700 truncate max-w-[150px]">{post.author.name}</span>
                      <span className="flex items-center space-x-1">
                        <Eye className="w-3 h-3" />
                        <span>{post.viewCount.toLocaleString("en-US")}</span>
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-white rounded-md border border-slate-200">
                <p className="text-slate-500 font-serif">No articles published in this category yet.</p>
              </div>
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
