"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, Eye, Flame, TrendingUp, Calendar } from "lucide-react";
import type { Post } from "@/lib/posts";
import { PaginationNav } from "@/components/ui/PaginationNav";
import { EDITORIAL_PAGE_SIZE } from "@/lib/pagination";

const PAGE_SIZE = EDITORIAL_PAGE_SIZE;
type Tab = "latest" | "hot" | "top";

export function EditorialSection({
  initialPosts,
  initialTotalPages,
  categorySlug,
  authorSlug,
  query,
}: {
  initialPosts: Post[];
  // Omit this on pages passing a pre-filtered list /api/posts can't reproduce
  // (author page's by-author filter, search's by-query filter) - falls back to
  // the original static client-side sort of just that list, no fetch, no pager.
  initialTotalPages?: number;
  // Same filters getPosts()/the /api/posts route accept - forwarded onto every
  // page/tab fetch so pagination stays within the filtered set.
  categorySlug?: string;
  authorSlug?: string;
  query?: string;
}) {
  const paginated = initialTotalPages !== undefined;
  const [activeTab, setActiveTab] = useState<Tab>("latest");
  // initialPosts arrives already sorted by published_at DESC (getPosts' default,
  // same as the "latest" tab's own order) - safe to slice directly for first paint,
  // no SSR/CSR mismatch.
  const [posts, setPosts] = useState(() => (paginated ? initialPosts.slice(0, PAGE_SIZE) : initialPosts));
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages ?? 1);
  const [loading, setLoading] = useState(false);

  function buildUrl(tab: Tab, pageNum: number) {
    const params = new URLSearchParams({ sort: tab, page: String(pageNum), limit: String(PAGE_SIZE) });
    if (categorySlug) params.set("category", categorySlug);
    if (authorSlug) params.set("author", authorSlug);
    if (query) params.set("q", query);
    return `/api/posts?${params.toString()}`;
  }

  async function fetchPage(tab: Tab, pageNum: number) {
    setLoading(true);
    try {
      const res = await fetch(buildUrl(tab, pageNum));
      const data: { posts: Post[]; page: number; totalPages: number } = await res.json();
      setPosts(data.posts);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } finally {
      setLoading(false);
    }
  }

  function sortInMemory(tab: Tab) {
    return [...initialPosts].sort((a, b) => {
      if (tab === "hot") return b.hotScore - a.hotScore;
      if (tab === "top") return b.viewCount - a.viewCount;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
  }

  function switchTab(tab: Tab) {
    setActiveTab(tab);
    if (!paginated) {
      setPosts(sortInMemory(tab));
      return;
    }
    if (tab === "latest") {
      // Already have this from SSR (same order as the DB's own "latest" sort) - no fetch needed.
      setPosts(initialPosts.slice(0, PAGE_SIZE));
      setPage(1);
      setTotalPages(initialTotalPages);
    } else {
      fetchPage(tab, 1);
    }
  }

  function goToPage(pageNum: number) {
    if (pageNum === page || pageNum < 1 || pageNum > totalPages) return;
    if (activeTab === "latest" && pageNum === 1) {
      setPosts(initialPosts.slice(0, PAGE_SIZE));
      setPage(1);
      return;
    }
    fetchPage(activeTab, pageNum);
    // Scroll the feed back into view - jumping to page 5 shouldn't leave the
    // reader staring at whatever was on screen from page 1's scroll position.
    document.getElementById("editorial-feed")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const tabs = [
    { key: "latest" as const, label: "Latest Digest", icon: Clock },
    { key: "hot" as const, label: "Trending & Hot", icon: Flame },
    { key: "top" as const, label: "Top All-Time", icon: TrendingUp },
  ];

  return (
    <div id="editorial-feed" className="w-full font-sans scroll-mt-24">
      <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2 mb-6">
        <div className="flex items-center space-x-2 sm:space-x-4">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => switchTab(key)}
              className={`flex items-center space-x-1.5 pb-2 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all -mb-[10px] ${
                activeTab === key ? "border-b-2 border-crimson-800 text-crimson-800 font-extrabold" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
        <span className="text-[11px] uppercase tracking-wider text-slate-400 font-mono hidden sm:inline">{posts.length} Law Digests</span>
      </div>

      <div className="space-y-6">
        {posts.map((post) => (
          <article key={post.id} className="group bg-white p-4 sm:p-5 rounded-md border border-slate-200 shadow-sm hover:shadow-md hover:border-crimson-700/40 transition-all">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              <div className="relative w-full sm:w-56 h-44 flex-shrink-0 overflow-hidden rounded bg-slate-100">
                <Image src={post.coverImage} alt={post.title} fill sizes="(max-width: 640px) 100vw, 224px" className="object-contain group-hover:scale-105 transition-transform duration-300" />
                <span className="absolute top-2 left-2 bg-crimson-800 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-sm">
                  {post.category.name}
                </span>
              </div>

              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1.5 font-medium">
                    <span className="text-slate-900 font-semibold">{post.author.name}</span>
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(post.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}</span>
                    </div>
                  </div>

                  <Link href={`/${post.category.slug}/${post.slug}`}>
                    <h3 className="font-serif text-base sm:text-lg font-bold text-slate-900 group-hover:text-crimson-800 leading-snug transition-colors">
                      {post.title}
                    </h3>
                  </Link>

                  <p className="text-slate-600 text-xs sm:text-sm mt-2 line-clamp-2 leading-relaxed">{post.excerpt}</p>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{post.readTimeMin} min read</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{post.viewCount.toLocaleString("en-US")} views</span>
                    </span>
                  </div>

                  <Link href={`/${post.category.slug}/${post.slug}`} className="text-crimson-800 font-semibold hover:underline text-xs flex items-center gap-0.5">
                    Read Full Opinion &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {paginated && <PaginationNav page={page} totalPages={totalPages} loading={loading} onPageChange={goToPage} />}
    </div>
  );
}
