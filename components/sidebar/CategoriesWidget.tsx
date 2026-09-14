"use client";

import Link from "next/link";
import { FolderOpen } from "lucide-react";
import type { Category } from "@/lib/posts";

export function CategoriesWidget({
  categories,
  className = "",
}: {
  categories: Category[];
  className?: string;
}) {
  return (
    <div className={`hidden lg:block bg-white p-5 rounded-md border border-slate-200 shadow-sm font-sans ${className}`}>
      <div className="border-b-2 border-slate-900 pb-2 mb-4">
        <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
          <FolderOpen className="w-4 h-4 text-slate-700" />
          <span>Categories</span>
        </h3>
      </div>

      <div className="flex flex-col space-y-2 max-h-[480px] overflow-y-auto pr-1">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/category/${cat.slug}`}
            className="flex items-center justify-between text-xs font-semibold py-2 px-2.5 rounded hover:bg-slate-100 text-slate-700 hover:text-crimson-800 transition-colors group"
          >
            <span className="flex items-center gap-2 min-w-0">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className="truncate">{cat.name}</span>
            </span>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded group-hover:bg-crimson-100 group-hover:text-crimson-800 transition-colors flex-shrink-0 ml-2">
              {cat.postCount ?? 0}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
