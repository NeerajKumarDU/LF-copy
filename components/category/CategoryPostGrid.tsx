"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Eye } from "lucide-react";
import type { Post } from "@/lib/posts";
import { PaginationNav } from "@/components/ui/PaginationNav";
import { CATEGORY_PAGE_SIZE } from "@/lib/pagination";

export function CategoryPostGrid({
  categorySlug,
  initialPosts,
  initialTotalPages,
}: {
  categorySlug: string;
  initialPosts: Post[];
  initialTotalPages: number;
}) {
  const [posts, setPosts] = useState(initialPosts);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [loading, setLoading] = useState(false);

  async function goToPage(pageNum: number) {
    if (pageNum === page || pageNum < 1 || pageNum > totalPages) return;
    if (pageNum === 1) {
      setPosts(initialPosts);
      setPage(1);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        category: categorySlug,
        page: String(pageNum),
        limit: String(CATEGORY_PAGE_SIZE),
      });
      const res = await fetch(`/api/posts?${params.toString()}`);
      const data: { posts: Post[]; page: number; totalPages: number } = await res.json();
      setPosts(data.posts);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } finally {
      setLoading(false);
    }
    document.getElementById("category-feed")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (posts.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-md border border-slate-200">
        <p className="text-slate-500 font-serif">No articles published in this category yet.</p>
      </div>
    );
  }

  return (
    <div id="category-feed" className="scroll-mt-24">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {posts.map((post) => (
          <article
            key={post.id}
            className="group bg-white rounded-md border border-slate-200 overflow-hidden shadow-sm hover:shadow-md hover:border-crimson-700/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="relative w-full h-48 bg-slate-900 overflow-hidden">
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  fill
                  sizes="(max-width: 640px) 100vw, 380px"
                  className="object-contain group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-2 left-2 bg-crimson-800 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow">
                  {post.category.name}
                </span>
              </div>

              <div className="p-4 sm:p-5">
                <div className="flex items-center space-x-2 text-[11px] text-slate-500 mb-2">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {new Date(post.publishedAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      timeZone: "UTC",
                    })}
                  </span>
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

      <PaginationNav page={page} totalPages={totalPages} loading={loading} onPageChange={goToPage} />
    </div>
  );
}
