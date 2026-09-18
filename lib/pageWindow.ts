// Plain (non "use client") module so Server Components can call this directly -
// see components/ui/PaginationNav.tsx, which re-exports it for client callers.
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
