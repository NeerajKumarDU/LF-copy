import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { getAuthorBySlug, getPosts, getPostsCount, getCategories } from "@/lib/posts";
import { EditorialSection } from "@/components/home/EditorialSection";
import { EDITORIAL_PAGE_SIZE } from "@/lib/pagination";
import { SidebarWidgets } from "@/components/sidebar/SidebarWidgets";

export const dynamic = "force-dynamic";

export default async function AuthorPage({ params }: { params: { slug: string } }) {
  const author = await getAuthorBySlug(params.slug);
  if (!author) notFound();

  const [authorPosts, authorPostCount, allPosts, categories] = await Promise.all([
    getPosts({ authorSlug: params.slug, limit: EDITORIAL_PAGE_SIZE }),
    getPostsCount({ authorSlug: params.slug }),
    getPosts({ limit: 10 }),
    getCategories(),
  ]);
  const initialTotalPages = Math.max(1, Math.ceil(authorPostCount / EDITORIAL_PAGE_SIZE));
  const trendingPosts = [...allPosts].sort((a, b) => b.hotScore - a.hotScore);

  return (
    <div className="w-full pb-16 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <nav className="flex items-center space-x-2 text-xs text-slate-500 py-3 border-b border-slate-200">
          <Link href="/" className="hover:text-crimson-800 transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-700 font-bold">{author.name}</span>
        </nav>

        <div className="my-6 p-6 sm:p-8 bg-slate-900 text-white rounded-md border border-slate-800 shadow-md flex items-center gap-5">
          <Image src={author.avatar} alt={author.name} width={72} height={72} className="rounded-full ring-2 ring-crimson-800/40" />
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-white">{author.name}</h1>
            <p className="text-slate-300 text-sm mt-1">{author.designation}</p>
            <p className="text-slate-400 text-sm mt-2 max-w-xl">{author.bio}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <EditorialSection initialPosts={authorPosts} initialTotalPages={initialTotalPages} authorSlug={params.slug} />
          </div>
          <div className="lg:col-span-4">
            <SidebarWidgets trendingPosts={trendingPosts} categories={categories} />
          </div>
        </div>
      </div>
    </div>
  );
}
