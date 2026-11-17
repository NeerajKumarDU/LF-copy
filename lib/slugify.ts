// Shared by the admin "new article" form (auto-fill from title) and available
// server-side too if a future caller needs the same rule.
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Redirect Location headers must be ASCII. WP-imported slugs (e.g. Hindi) may be
// stored raw or already percent-encoded, so decode first to avoid double-encoding.
export function encodeSlugPath(slug: string): string {
  let decoded = slug;
  try {
    decoded = decodeURIComponent(slug);
  } catch {
    // stray '%' - treat as raw text
  }
  return encodeURIComponent(decoded);
}
