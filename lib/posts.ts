// Real Postgres-backed data layer, replacing lib/mock-data.ts (plan.md §5, Week 2).
// Same shapes/function signatures as the old mock module so component props didn't change —
// only callers had to switch to `await`. coverImage lives in posts.meta->>'coverImage' until
// the real `media` table is populated by etl.py; hotScore/readTimeMin are computed here, not
// stored columns (see schema.appext.sql).
import { query } from "./db";

// Images stay at the original WP path (plan.md §6: "preserved exactly", zero rewriting).
// media.path is relative ('2017/11/foo.jpg'); this is the one place the base is assembled.
// Path-only, no host: prod serves this via nginx alias on the same domain (§6), and
// dev serves it from public/wp-content/uploads/ (rsync'd copy) — both same-origin, no
// remotePatterns entry needed either way.
const WP_UPLOADS_BASE = "/wp-content/uploads";
const FALLBACK_COVER = "/placeholder-cover.svg";
// Most real (ETL'd) authors have no avatar_url — WordPress never had one to
// import. `<Image src="">` (empty string) throws at runtime, so fall back to
// a real asset rather than "".
const FALLBACK_AVATAR = "/placeholder-avatar.svg";

export interface Author {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  designation?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  postCount?: number;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string; // last path segment; full URL is /{category.slug}/{slug}
  excerpt: string;
  content: string;
  coverImage: string;
  isFeatured: boolean;
  isBreaking: boolean;
  viewCount: number;
  commentsCount?: number;
  hotScore: number;
  readTimeMin: number;
  publishedAt: string;
  authorId: string;
  author: Author;
  categoryId: string;
  category: Category;
  tags: { tag: Tag }[];
}

const WORDS_PER_MINUTE = 200;

function readTimeFor(content: string) {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

// Simple recency-weighted score: views decay against age in days. Good enough for
// "Hot" sort ordering without a stored, driftable column.
function hotScoreFor(viewCount: number, publishedAt: string) {
  const ageDays = Math.max(1, (Date.now() - new Date(publishedAt).getTime()) / 86_400_000);
  return Math.round((viewCount / Math.sqrt(ageDays)) * 100) / 100;
}

const POST_ROW_QUERY = `
  SELECT
    p.id, p.title, p.slug, p.excerpt, p.content, p.is_featured, p.is_breaking,
    p.view_count, p.published_at, p.meta,
    a.id AS author_id, a.display_name AS author_name, a.avatar_url AS author_avatar,
    a.bio AS author_bio,
    c.id AS category_id, c.name AS category_name, c.slug AS category_slug,
    c.description AS category_description, c.color AS category_color,
    COALESCE(
      (SELECT json_agg(json_build_object('id', t.id, 'name', t.name, 'slug', t.slug))
       FROM post_tags pt JOIN tags t ON t.id = pt.tag_id WHERE pt.post_id = p.id),
      '[]'
    ) AS tags,
    (SELECT count(*) FROM comments cm WHERE cm.post_id = p.id AND cm.approved)::int AS comments_count,
    m.path AS media_path
  FROM posts p
  LEFT JOIN authors a ON a.id = p.author_id
  JOIN categories c ON c.id = p.primary_category_id
  LEFT JOIN media m ON m.id = p.featured_media_id
  WHERE p.status = 'published'
`;

type PostRow = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  is_featured: boolean;
  is_breaking: boolean;
  view_count: number;
  published_at: string;
  meta: { coverImage?: string };
  author_id: number | null;
  author_name: string | null;
  author_avatar: string | null;
  author_bio: string | null;
  category_id: number;
  category_name: string;
  category_slug: string;
  category_description: string | null;
  category_color: string | null;
  tags: { id: number; name: string; slug: string }[];
  comments_count: number;
  media_path: string | null;
};

function mapPost(row: PostRow): Post {
  const publishedAt = new Date(row.published_at).toISOString();
  const category: Category = {
    id: String(row.category_id),
    name: row.category_name,
    slug: row.category_slug,
    description: row.category_description ?? "",
    color: row.category_color ?? "#111827",
  };
  const author: Author = {
    id: String(row.author_id ?? ""),
    name: row.author_name ?? "Unknown",
    avatar: row.author_avatar || FALLBACK_AVATAR,
    bio: row.author_bio ?? "",
  };
  return {
    id: String(row.id),
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt ?? "",
    content: row.content,
    coverImage: row.media_path
      ? `${WP_UPLOADS_BASE}/${row.media_path}`
      : row.meta?.coverImage || FALLBACK_COVER,
    isFeatured: row.is_featured,
    isBreaking: row.is_breaking,
    viewCount: row.view_count,
    commentsCount: row.comments_count,
    hotScore: hotScoreFor(row.view_count, publishedAt),
    readTimeMin: readTimeFor(row.content),
    publishedAt,
    authorId: author.id,
    author,
    categoryId: category.id,
    category,
    tags: row.tags.map((t) => ({ tag: { id: String(t.id), name: t.name, slug: t.slug } })),
  };
}

// Mirrors hotScoreFor() above exactly (views decayed by age in days), so DB-side
// "hot" ordering agrees with the score shown/used client-side.
const ORDER_BY: Record<"latest" | "hot" | "top", string> = {
  latest: "p.published_at DESC",
  top: "p.view_count DESC",
  hot: "p.view_count / sqrt(GREATEST(1, EXTRACT(EPOCH FROM (now() - p.published_at)) / 86400)) DESC",
};

export async function getPosts(opts?: {
  categorySlug?: string;
  authorSlug?: string;
  query?: string;
  limit?: number;
  offset?: number;
  sort?: "latest" | "hot" | "top";
}): Promise<Post[]> {
  const clauses: string[] = [];
  const params: unknown[] = [];
  if (opts?.categorySlug) {
    params.push(opts.categorySlug);
    clauses.push(`c.slug = $${params.length}`);
  }
  if (opts?.authorSlug) {
    params.push(opts.authorSlug);
    clauses.push(`a.slug = $${params.length}`);
  }
  if (opts?.query) {
    params.push(opts.query);
    clauses.push(`p.search_tsv @@ plainto_tsquery('english', $${params.length})`);
  }
  let sql = POST_ROW_QUERY;
  if (clauses.length) sql += ` AND ${clauses.join(" AND ")}`;
  sql += ` ORDER BY ${ORDER_BY[opts?.sort ?? "latest"]}`;
  if (opts?.limit) {
    params.push(opts.limit);
    sql += ` LIMIT $${params.length}`;
  }
  if (opts?.offset) {
    params.push(opts.offset);
    sql += ` OFFSET $${params.length}`;
  }
  const { rows } = await query<PostRow>(sql, params);
  return rows.map(mapPost);
}

// Total published-post count for a filter, independent of sort - backs numbered
// pagination (lib/posts.ts callers need this to compute page counts up front).
export async function getPostsCount(opts?: { categorySlug?: string; authorSlug?: string; query?: string }): Promise<number> {
  const clauses: string[] = ["p.status = 'published'"];
  const params: unknown[] = [];
  if (opts?.categorySlug) {
    params.push(opts.categorySlug);
    clauses.push(`c.slug = $${params.length}`);
  }
  if (opts?.authorSlug) {
    params.push(opts.authorSlug);
    clauses.push(`a.slug = $${params.length}`);
  }
  if (opts?.query) {
    params.push(opts.query);
    clauses.push(`p.search_tsv @@ plainto_tsquery('english', $${params.length})`);
  }
  const { rows } = await query<{ count: string }>(
    `SELECT count(*) FROM posts p
     JOIN categories c ON c.id = p.primary_category_id
     LEFT JOIN authors a ON a.id = p.author_id
     WHERE ${clauses.join(" AND ")}`,
    params
  );
  return Number(rows[0]?.count ?? 0);
}

export async function getPostBySlug(categorySlug: string, slug: string): Promise<Post | undefined> {
  const sql = `${POST_ROW_QUERY} AND c.slug = $1 AND p.slug = $2 LIMIT 1`;
  const { rows } = await query<PostRow>(sql, [categorySlug, slug]);
  return rows[0] ? mapPost(rows[0]) : undefined;
}

export async function getCategories(): Promise<Category[]> {
  const { rows } = await query<{
    id: number; name: string; slug: string; description: string | null; color: string | null; post_count: string;
  }>(`
    SELECT c.id, c.name, c.slug, c.description, c.color, count(p.id)::text AS post_count
    FROM categories c
    LEFT JOIN posts p ON p.primary_category_id = c.id AND p.status = 'published'
    GROUP BY c.id
    ORDER BY c.name
  `);
  return rows.map((r) => ({
    id: String(r.id),
    name: r.name,
    slug: r.slug,
    description: r.description ?? "",
    color: r.color ?? "#111827",
    postCount: Number(r.post_count),
  }));
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  const categories = await getCategories();
  return categories.find((c) => c.slug === slug);
}

// Client dedupes repeat views itself (localStorage) before ever calling this -
// server just trusts the increment. Scoped to published posts so drafts/private
// posts (never publicly viewable) can't be prodded via a guessed id.
export async function incrementPostViewCount(id: string): Promise<boolean> {
  if (!id || isNaN(Number(id))) return false;
  const result = await query(`UPDATE posts SET view_count = view_count + 1 WHERE id = $1::bigint AND status = 'published'`, [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function getAuthorBySlug(slug: string): Promise<Author | undefined> {
  const { rows } = await query<{ id: number; slug: string; display_name: string; avatar_url: string | null; bio: string | null }>(
    `SELECT id, slug, display_name, avatar_url, bio FROM authors WHERE slug = $1 LIMIT 1`,
    [slug]
  );
  const row = rows[0];
  if (!row) return undefined;
  return { id: String(row.id), name: row.display_name, avatar: row.avatar_url || FALLBACK_AVATAR, bio: row.bio ?? "" };
}
