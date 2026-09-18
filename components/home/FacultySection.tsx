"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Clock, Eye } from "lucide-react";
import type { Post } from "@/lib/posts";

export function FacultySection({ posts }: { posts: Post[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const facultyPosts = posts.filter((p) => p.category.slug === "du-llb");
  const displayPosts = facultyPosts.length > 0 ? facultyPosts : posts;
  const mainPost = displayPosts[currentIndex] || displayPosts[0];

  const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + displayPosts.length) % displayPosts.length);
  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % displayPosts.length);

  return (
    <div className="w-full font-sans">
      <div className="border-t-[3px] border-red-600 pt-2 pb-2 mb-4 flex items-center justify-between">
        <h2 className="font-sans font-black text-base sm:text-lg uppercase text-[#E52E2E] tracking-tight">FACULTY OF LAW DU</h2>

        <div className="flex items-center space-x-1">
          <button onClick={handlePrev} className="p-1 text-neutral-500 hover:text-neutral-900 border border-neutral-200 hover:bg-neutral-100 transition-colors" aria-label="Previous Post">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleNext} className="p-1 text-neutral-500 hover:text-neutral-900 border border-neutral-200 hover:bg-neutral-100 transition-colors" aria-label="Next Post">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {mainPost && (
        <div className="bg-neutral-100 border border-neutral-200 p-4 sm:p-5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            <div className="md:col-span-6 relative h-48 sm:h-56 bg-neutral-200 overflow-hidden">
              <Image src={mainPost.coverImage} alt={mainPost.title} fill sizes="(max-width: 768px) 100vw, 300px" className="object-contain" />
            </div>

            <div className="md:col-span-6 flex flex-col justify-between">
              <div>
                <span className="inline-block bg-red-600 text-white text-[10px] font-bold uppercase px-2 py-0.5 mb-2">
                  {mainPost.category.name}
                </span>

                <Link href={`/${mainPost.category.slug}/${mainPost.slug}`}>
                  <h3 className="font-sans font-bold text-sm sm:text-base text-neutral-950 hover:text-red-600 leading-snug transition-colors">
                    {mainPost.title}
                  </h3>
                </Link>

                <p className="text-xs text-neutral-600 mt-2 line-clamp-3 leading-relaxed">{mainPost.excerpt}</p>
              </div>

              <div className="flex items-center space-x-3 text-[11px] text-neutral-500 mt-4 pt-2 border-t border-neutral-200">
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(mainPost.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}</span>
                </div>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  <Eye className="w-3 h-3" />
                  <span>{mainPost.viewCount} views</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
