import Link from "next/link";
import Image from "next/image";
import { Clock, Eye, MessageSquare } from "lucide-react";
import type { Post } from "@/lib/posts";

export function HeroMagazineGrid({ posts }: { posts: Post[] }) {
  if (!posts || posts.length === 0) return null;

  const [centerFeatured, topLeft, bottomLeft, topRight, bottomRight] = [
    posts[0], posts[1] ?? posts[0], posts[2] ?? posts[0], posts[3] ?? posts[0], posts[4] ?? posts[0],
  ];

  const SideCard = ({ post }: { post: Post }) => (
    <div className="relative group overflow-hidden bg-neutral-900 min-h-[220px] md:min-h-0 flex flex-col justify-end">
      <Image
        src={post.coverImage}
        alt={post.title}
        fill
        sizes="(max-width: 768px) 100vw, 25vw"
        className="object-contain group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-75"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
      <div className="relative z-10 p-3 sm:p-4">
        <Link href={`/${post.category.slug}/${post.slug}`}>
          <h3 className="font-sans font-bold text-white text-xs sm:text-[13px] leading-snug group-hover:underline line-clamp-3 drop-shadow">
            {post.title}
          </h3>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="w-full bg-[#FAFAFA] font-sans border-b border-neutral-200">
      <div className="w-full max-w-[1550px] mx-auto p-0 sm:px-2 py-0">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-1 h-auto md:h-[500px]">
          <div className="md:col-span-3 grid grid-rows-2 gap-1 h-full">
            <SideCard post={topLeft} />
            <SideCard post={bottomLeft} />
          </div>

          <div className="md:col-span-6 relative group overflow-hidden bg-neutral-950 min-h-[380px] md:min-h-full flex flex-col justify-end">
            <Image
              src={centerFeatured.coverImage}
              alt={centerFeatured.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-contain object-center group-hover:scale-105 transition-transform duration-700 opacity-95 group-hover:opacity-85"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent pointer-events-none" />

            <div className="relative z-10 p-5 sm:p-7">
              <div className="mb-2">
                <Link
                  href={`/category/${centerFeatured.category.slug}`}
                  className="bg-black/90 text-white text-[11px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider hover:bg-red-700 transition-colors inline-block"
                >
                  {centerFeatured.category.name}
                </Link>
              </div>

              <Link href={`/${centerFeatured.category.slug}/${centerFeatured.slug}`}>
                <h1 className="font-sans text-lg sm:text-2xl md:text-[25px] font-black text-white leading-snug group-hover:underline transition-colors drop-shadow-md">
                  {centerFeatured.title}
                </h1>
              </Link>

              <div className="flex items-center space-x-3 mt-3 text-xs text-neutral-300 font-sans">
                <div className="flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(centerFeatured.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}</span>
                </div>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{centerFeatured.viewCount}</span>
                </div>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{centerFeatured.commentsCount || 0}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-3 grid grid-rows-2 gap-1 h-full">
            <SideCard post={topRight} />
            <SideCard post={bottomRight} />
          </div>
        </div>
      </div>
    </div>
  );
}
