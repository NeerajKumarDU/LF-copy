"use client";

import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

// Windowed page-number list with ellipsis gaps, e.g. [1, "…", 4, 5, 6, "…", 42] -
// showing all N pages as buttons stops making sense once N gets into the hundreds.
export function pageWindow(current: number, total: number): (number | "…")[] {
  const pages: (number | "…")[] = [];
  const add = (n: number) => pages.push(n);
  const span = 1; // neighbors shown on each side of current

  add(1);
  if (current - span > 2) pages.push("…");
  for (let p = Math.max(2, current - span); p <= Math.min(total - 1, current + span); p++) add(p);
  if (current + span < total - 1) pages.push("…");
  if (total > 1) add(total);
  return pages;
}

export function PaginationNav({
  page,
  totalPages,
  loading = false,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-8 flex flex-col items-center gap-2">
      <nav aria-label="Article pages" className="flex items-center justify-center gap-1.5">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1 || loading}
        aria-label="Previous page"
        className="p-2 rounded-md border border-slate-300 text-slate-600 hover:border-crimson-700 hover:text-crimson-800 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-slate-300 disabled:hover:text-slate-600 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {pageWindow(page, totalPages).map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-2 text-slate-400 text-sm select-none">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            disabled={loading}
            aria-current={p === page ? "page" : undefined}
            className={`min-w-[2.25rem] h-9 px-2 rounded-md text-xs font-bold transition-colors disabled:cursor-wait ${
              p === page
                ? "bg-crimson-800 text-white"
                : "border border-slate-300 text-slate-700 hover:border-crimson-700 hover:text-crimson-800"
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages || loading}
        aria-label="Next page"
        className="p-2 rounded-md border border-slate-300 text-slate-600 hover:border-crimson-700 hover:text-crimson-800 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-slate-300 disabled:hover:text-slate-600 transition-colors"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
      </button>
      </nav>
      <span className="text-[11px] text-slate-400 font-mono">
        Page {page} of {totalPages}
      </span>
    </div>
  );
}
