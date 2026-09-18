import Link from "next/link";
import Image from "next/image";
import { Clock, MessageSquare } from "lucide-react";
import type { Post } from "@/lib/posts";

export function PopularPostsWidget({ posts }: { posts: Post[] }) {
  const popular = [...posts].sort((a, b) => b.viewCount - a.viewCount).slice(0, 5);

  return (
    <div className="w-full font-sans">
      <div className="border-b-[3px] border-black pb-2 mb-4">
        <h3 className="font-sans font-black text-sm sm:text-base tracking-wider uppercase text-black">POPULAR POSTS</h3>
      </div>

      <div className="space-y-4">
        {popular.map((post) => (
          <div key={post.id} className="flex items-start space-x-3 group">
            <Link
              href={`/${post.category.slug}/${post.slug}`}
              className="relative w-20 h-16 flex-shrink-0 bg-neutral-200 overflow-hidden flex items-center justify-center border border-neutral-200"
            >
              <Image src={post.coverImage} alt={post.title} fill sizes="80px" className="object-contain group-hover:scale-105 transition-transform duration-300" />
            </Link>

            <div className="flex-1">
              <Link href={`/${post.category.slug}/${post.slug}`}>
                <h4 className="font-sans text-xs font-bold text-neutral-900 group-hover:text-red-700 leading-snug uppercase line-clamp-2 transition-colors">
                  {post.title}
                </h4>
              </Link>

              <div className="flex items-center space-x-2 mt-1 text-[11px] text-neutral-500 font-sans">
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-neutral-400" />
                  <span>{new Date(post.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}</span>
                </div>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  <MessageSquare className="w-3 h-3 text-neutral-400" />
                  <span>{post.commentsCount || 0}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
