import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Clock, Eye, Calendar, ChevronRight, Tag as TagIcon, MessageSquare, Scale } from "lucide-react";
import DOMPurify from "isomorphic-dompurify";
import { getPostBySlug, getPosts, getCategories } from "@/lib/posts";
import { ShareButtons } from "@/components/post/ShareButtons";
import { SidebarWidgets } from "@/components/sidebar/SidebarWidgets";

// Matches the WP permalink /%category%/%postname%/ (plan.md §5.2): the last
// segment is the post slug, everything before it is the category path.
export const dynamic = "force-dynamic";

function resolve(segments: string[]) {
  // A real post URL is always /{category...}/{postname} — at least 2 segments.
  // Anything else (stray /favicon.ico, /robots.txt, etc. falling through to
  // this catch-all) isn't a post; skip the DB round-trip and 404 immediately.
  if (segments.length < 2) return Promise.resolve(undefined);
  const slug = segments[segments.length - 1];
  const categorySlug = segments.slice(0, -1).join("/");
  return getPostBySlug(categorySlug, slug);
}

export async function generateMetadata({ params }: { params: { slug: string[] } }): Promise<Metadata> {
  const post = await resolve(params.slug);
  if (!post) return { title: "Article Not Found" };
  return { title: post.title, description: post.excerpt };
}

export default async function PostDetailPage({ params }: { params: { slug: string[] } }) {
  const post = await resolve(params.slug);
  if (!post) notFound();

  const allPosts = await getPosts({ limit: 10 });
  const categories = await getCategories();
  const relatedPosts = allPosts.filter((p) => p.slug !== post.slug && p.category.slug === post.category.slug).slice(0, 3);
  const trendingPosts = [...allPosts].sort((a, b) => b.hotScore - a.hotScore);

  return (
    <div className="w-full pb-16 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <nav className="flex items-center space-x-2 text-xs text-slate-500 py-3 border-b border-slate-200">
          <Link href="/" className="hover:text-crimson-800 transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href={`/category/${post.category.slug}`} className="hover:text-crimson-800 transition-colors">{post.category.name}</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="truncate max-w-xs sm:max-w-md text-slate-700 font-medium">{post.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
          <article className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-md border border-slate-200 shadow-sm">
            <div className="mb-3">
              <Link href={`/category/${post.category.slug}`} className="bg-crimson-800 hover:bg-crimson-700 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded shadow-sm inline-block transition-colors">
                {post.category.name}
              </Link>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight">{post.title}</h1>

            {post.excerpt && (
              <p className="font-serif text-base sm:text-lg text-slate-600 mt-4 leading-relaxed italic border-l-2 border-amber-500 pl-3">{post.excerpt}</p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 py-4 my-6 border-y border-slate-100 text-xs text-slate-500">
              <div className="flex items-center space-x-3">
                <Image src={post.author.avatar} alt={post.author.name} width={40} height={40} className="rounded-full ring-2 ring-slate-200" />
                <div>
                  <div className="font-bold text-slate-900">{post.author.name}</div>
                  <div className="text-[11px] text-slate-500">{post.author.designation}</div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <span className="flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(post.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{post.readTimeMin} min read</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{post.viewCount.toLocaleString("en-US")} views</span>
                </span>
              </div>
            </div>

            <div className="mb-6">
              <ShareButtons title={post.title} />
            </div>

            <div className="relative w-full h-72 sm:h-96 rounded-md overflow-hidden mb-6 bg-slate-900">
              <Image src={post.coverImage} alt={post.title} fill priority sizes="(max-width: 1024px) 100vw, 800px" className="object-cover" />
            </div>

            {/* Real content is Gutenberg-cleaned HTML from etl.py, not markdown — render it as
                markup, but sanitize first. This is scraped from a WordPress install with a known
                compromise history (plan.md §10: malicious script found in wp_posts), so untrusted
                HTML must never go to dangerouslySetInnerHTML unsanitized. */}
            <div
              className="editorial-content mt-6"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
            />

            {post.tags.length > 0 && (
              <div className="mt-8 pt-4 border-t border-slate-200 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-600 flex items-center gap-1 mr-1">
                  <TagIcon className="w-3.5 h-3.5" /> Tags:
                </span>
                {post.tags.map(({ tag }) => (
                  <span key={tag.id} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded transition-colors font-sans">
                    #{tag.name}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-8 p-5 bg-slate-50 rounded-md border border-slate-200 flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <Image src={post.author.avatar} alt={post.author.name} width={64} height={64} className="rounded-full ring-2 ring-crimson-800/40 flex-shrink-0" />
              <div>
                <h4 className="font-serif font-bold text-sm sm:text-base text-slate-900">{post.author.name}</h4>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">{post.author.bio}</p>
              </div>
            </div>

            {relatedPosts.length > 0 && (
              <div className="mt-10 pt-6 border-t-2 border-slate-900">
                <h3 className="font-serif text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Scale className="w-5 h-5 text-crimson-800" />
                  <span>Related Posts</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {relatedPosts.map((rel) => (
                    <Link key={rel.id} href={`/${rel.category.slug}/${rel.slug}`} className="group block bg-slate-50 p-3 rounded border border-slate-200 hover:border-crimson-700/50 transition-all">
                      <div className="relative w-full h-28 rounded overflow-hidden mb-2 bg-slate-900">
                        <Image src={rel.coverImage} alt={rel.title} fill sizes="(max-width: 640px) 100vw, 250px" className="object-cover group-hover:scale-105 transition-transform" />
                      </div>
                      <h4 className="font-serif text-xs font-bold text-slate-900 group-hover:text-crimson-800 line-clamp-2 leading-snug">{rel.title}</h4>
                      <span className="text-[11px] text-slate-400 mt-1 block">{rel.readTimeMin} min read</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-10 pt-6 border-t border-slate-200">
              <h3 className="font-serif text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-500" />
                <span>Comments</span>
              </h3>
              <p className="text-xs text-slate-500 mb-6 italic">No comments yet.</p>

              <form className="space-y-3 bg-slate-50 p-4 rounded-md border border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input type="text" placeholder="Name" className="w-full text-xs p-2 rounded bg-white border border-slate-300 text-slate-900" />
                  <input type="email" placeholder="Email" className="w-full text-xs p-2 rounded bg-white border border-slate-300 text-slate-900" />
                </div>
                <textarea rows={3} placeholder="Comment" className="w-full text-xs p-2 rounded bg-white border border-slate-300 text-slate-900" />
                <button type="button" className="bg-crimson-800 hover:bg-crimson-700 text-white text-xs font-bold px-4 py-2 rounded transition-colors">
                  Post Comment
                </button>
              </form>
            </div>
          </article>

          <div className="lg:col-span-4">
            <SidebarWidgets trendingPosts={trendingPosts} categories={categories} />
          </div>
        </div>
      </div>
    </div>
  );
}
