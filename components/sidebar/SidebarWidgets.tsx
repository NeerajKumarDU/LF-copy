"use client";

import { useState } from "react";
import Link from "next/link";
import { TrendingUp, FolderOpen, Mail, CheckCircle2 } from "lucide-react";
import type { Post, Category } from "@/lib/posts";

export function SidebarWidgets({ trendingPosts, categories }: { trendingPosts: Post[]; categories?: Category[] }) {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const top5Trending = trendingPosts.slice(0, 5);

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail) setSubscribed(true);
  };

  return (
    <aside className="w-full space-y-8 font-sans">
      <div className="bg-white p-5 rounded-md border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2 mb-4">
          <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-crimson-800" />
            <span>Trending</span>
          </h3>
        </div>

        <div className="space-y-4">
          {top5Trending.map((post, idx) => (
            <div key={post.id} className="flex items-start space-x-3 group">
              <span className={`font-serif text-2xl font-black leading-none flex-shrink-0 w-6 text-center ${idx === 0 ? "text-crimson-800" : idx === 1 ? "text-amber-600" : "text-slate-300"}`}>
                0{idx + 1}
              </span>
              <div className="flex-1">
                <Link href={`/${post.category.slug}/${post.slug}`} className="font-serif text-xs sm:text-sm font-bold text-slate-900 group-hover:text-crimson-800 leading-snug line-clamp-2 transition-colors">
                  {post.title}
                </Link>
                <div className="flex items-center space-x-2 mt-1 text-[11px] text-slate-400">
                  <span>{post.category.name}</span>
                  <span>•</span>
                  <span>{post.viewCount.toLocaleString("en-US")} views</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop only - mobile gets this same list inside the Navbar hamburger instead
          of stacking a second copy into the page flow below the main content. */}
      {categories && categories.length > 0 && (
        <div className="hidden lg:block bg-white p-5 rounded-md border border-slate-200 shadow-sm">
          <div className="border-b-2 border-slate-900 pb-2 mb-4">
            <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <FolderOpen className="w-4 h-4 text-slate-700" />
              <span>Categories</span>
            </h3>
          </div>

          <div className="flex flex-col space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {categories.map((cat) => (
              <Link key={cat.id} href={`/category/${cat.slug}`} className="flex items-center justify-between text-xs font-semibold py-2 px-2.5 rounded hover:bg-slate-100 text-slate-700 hover:text-crimson-800 transition-colors group">
                <span className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="truncate">{cat.name}</span>
                </span>
                <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded group-hover:bg-crimson-100 group-hover:text-crimson-800 transition-colors flex-shrink-0 ml-2">
                  {cat.postCount ?? 0}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="bg-slate-100 p-5 rounded-md border border-slate-300">
        <div className="flex items-center space-x-2 text-crimson-800 mb-2">
          <Mail className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">The Daily Verdict</span>
        </div>
        <h4 className="font-serif text-sm font-bold text-slate-900">Legal Dispatch Newsletter</h4>
        <p className="text-xs text-slate-600 mt-1 mb-3">Curated case law briefs, exam guides, and legal analysis delivered straight to your inbox.</p>

        {subscribed ? (
          <div className="flex items-center space-x-2 text-emerald-700 text-xs font-semibold bg-emerald-100 p-2.5 rounded">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>Subscribed successfully.</span>
          </div>
        ) : (
          <form onSubmit={handleNewsletter} className="space-y-2">
            <input
              type="email"
              placeholder="you@example.com"
              required
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              className="w-full bg-white text-slate-900 placeholder-slate-400 text-xs px-3 py-2 rounded border border-slate-300 focus:outline-none focus:border-crimson-700 font-sans"
            />
            <button type="submit" className="w-full bg-crimson-800 hover:bg-crimson-700 text-white text-xs font-bold py-2 rounded transition-colors shadow-sm">
              Subscribe
            </button>
          </form>
        )}
      </div>
    </aside>
  );
}
