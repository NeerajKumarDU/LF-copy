// Admin-only queries: writes, and reads that need every status (not just
// 'published') or plain author/category lists for form dropdowns. Kept out of
// lib/posts.ts (the public read layer) since these have no public caller and
// most of them mutate.
import { query } from "./db";
import { slugify } from "./slugify";

export interface AdminAuthor {
  id: string;
  name: string;
}

export interface AdminPostRow {
  id: string;
  title: string;
  slug: string;
  status: "published" | "draft" | "private";
  categoryName: string | null;
  categorySlug: string | null;
  authorName: string;
  publishedAt: string | null;
  updatedAt: string;
}

const ADMIN_PAGE_SIZE = 20;

let hasEnsuredPasswordColumn = false;
export async function ensureAuthorPasswordColumn(): Promise<void> {
  if (hasEnsuredPasswordColumn) return;
  try {
    await query(`ALTER TABLE authors ADD COLUMN IF NOT EXISTS password_hash text;`);
    hasEnsuredPasswordColumn = true;
  } catch (err) {
    console.error("Failed to ensure password_hash column in authors table:", err);
  }
}

export async function getAdminPosts(
  page: number,
  authorId?: string
): Promise<{ posts: AdminPostRow[]; totalPages: number; total: number }> {
  const offset = (Math.max(1, page) - 1) * ADMIN_PAGE_SIZE;
  const hasAuthorFilter = Boolean(authorId && !isNaN(Number(authorId)));

  const postsQuery = hasAuthorFilter
    ? `SELECT p.id, p.title, p.slug, p.status,
              c.name AS category_name, c.slug AS category_slug,
              a.display_name AS author_name, p.published_at, p.updated_at
       FROM posts p
       LEFT JOIN categories c ON c.id = p.primary_category_id
       LEFT JOIN authors a ON a.id = p.author_id
       WHERE p.author_id = $3::bigint
       ORDER BY p.updated_at DESC
       LIMIT $1 OFFSET $2`
    : `SELECT p.id, p.title, p.slug, p.status,
              c.name AS category_name, c.slug AS category_slug,
              a.display_name AS author_name, p.published_at, p.updated_at
       FROM posts p
       LEFT JOIN categories c ON c.id = p.primary_category_id
       LEFT JOIN authors a ON a.id = p.author_id
       ORDER BY p.updated_at DESC
       LIMIT $1 OFFSET $2`;

  const countQuery = hasAuthorFilter
    ? `SELECT count(*) FROM posts WHERE author_id = $1::bigint`
    : `SELECT count(*) FROM posts`;

  const countParams = hasAuthorFilter ? [authorId] : [];
  const postsParams = hasAuthorFilter ? [ADMIN_PAGE_SIZE, offset, authorId] : [ADMIN_PAGE_SIZE, offset];

  const [{ rows }, { rows: countRows }] = await Promise.all([
    query<{
      id: number;
      title: string;
      slug: string;
      status: string;
      category_name: string | null;
      category_slug: string | null;
      author_name: string | null;
      published_at: string | null;
      updated_at: string;
    }>(postsQuery, postsParams),
    query<{ count: string }>(countQuery, countParams),
  ]);
  const total = Number(countRows[0]?.count ?? 0);
  return {
    posts: rows.map((r) => ({
      id: String(r.id),
      title: r.title,
      slug: r.slug,
      status: r.status as AdminPostRow["status"],
      categoryName: r.category_name,
      categorySlug: r.category_slug,
      authorName: r.author_name ?? "Unknown",
      publishedAt: r.published_at,
      updatedAt: r.updated_at,
    })),
    totalPages: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)),
    total,
  };
}

export async function getAuthorsList(): Promise<AdminAuthor[]> {
  const { rows } = await query<{ id: number; display_name: string }>(
    `SELECT id, display_name FROM authors ORDER BY display_name`
  );
  return rows.map((r) => ({ id: String(r.id), name: r.display_name }));
}

async function uniqueSlug(table: "authors" | "categories", base: string): Promise<string> {
  let candidate = base || "untitled";
  let n = 2;
  // Small table, admin-driven (not a hot path) - a loop is fine over a
  // cleverer single query.
  while ((await query(`SELECT 1 FROM ${table} WHERE slug = $1`, [candidate])).rows.length > 0) {
    candidate = `${base}-${n++}`;
  }
  return candidate;
}

// Author field is writable-with-suggestions (input+datalist in the UI): the
// name typed may already exist, or be brand new. Match case-insensitively so
// re-picking "Jane Doe" from the datalist doesn't spawn a duplicate row.
export async function findOrCreateAuthorByName(name: string): Promise<string> {
  const trimmed = name.trim();
  const { rows } = await query<{ id: number }>(`SELECT id FROM authors WHERE lower(display_name) = lower($1) LIMIT 1`, [
    trimmed,
  ]);
  if (rows[0]) return String(rows[0].id);

  const slug = await uniqueSlug("authors", slugify(trimmed));
  const wpId = -Date.now();
  const { rows: inserted } = await query<{ id: number }>(
    `INSERT INTO authors (wp_id, slug, display_name) VALUES ($1, $2, $3) RETURNING id`,
    [wpId, slug, trimmed]
  );
  return String(inserted[0].id);
}

// Backs approved author-signup requests (lib/author-requests.ts). Unlike
// findOrCreateAuthorByName, this always inserts a fresh row rather than
// attaching to an existing same-named author - approving a request should
// never silently give someone else's byline to a new account.
export async function createAuthorAccount(name: string, passwordHash: string): Promise<{ id: string; name: string }> {
  const trimmed = name.trim();
  const slug = await uniqueSlug("authors", slugify(trimmed));
  const wpId = -Date.now();
  const { rows } = await query<{ id: number }>(
    `INSERT INTO authors (wp_id, slug, display_name, password_hash) VALUES ($1, $2, $3, $4) RETURNING id`,
    [wpId, slug, trimmed, passwordHash]
  );
  return { id: String(rows[0].id), name: trimmed };
}

// Same idea for categories, plus a default pill color since color has no
// WP source (schema.appext.sql - app-owned, editorial choice).
const NEW_CATEGORY_COLOR = "#111827";

export async function findOrCreateCategoryByName(name: string): Promise<{ id: string; slug: string }> {
  const trimmed = name.trim();
  const { rows } = await query<{ id: number; slug: string }>(
    `SELECT id, slug FROM categories WHERE lower(name) = lower($1) LIMIT 1`,
    [trimmed]
  );
  if (rows[0]) return { id: String(rows[0].id), slug: rows[0].slug };

  const slug = await uniqueSlug("categories", slugify(trimmed));
  const wpTermId = -Date.now();
  const { rows: inserted } = await query<{ id: number; slug: string }>(
    `INSERT INTO categories (wp_term_id, slug, name, color) VALUES ($1, $2, $3, $4) RETURNING id, slug`,
    [wpTermId, slug, trimmed, NEW_CATEGORY_COLOR]
  );
  return { id: String(inserted[0].id), slug: inserted[0].slug };
}

// DB only enforces uniqueness among published posts (posts_slug_live, a partial
// index - schema.sql: "slug only needs to be unique among live posts; drafts
// may collide"). Checking against ALL posts here is stricter than the DB
// requires, on purpose: two drafts silently sharing a slug is confusing even
// though Postgres would allow it.
export async function isSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
  if (excludeId && !isNaN(Number(excludeId))) {
    const { rows } = await query(`SELECT 1 FROM posts WHERE slug = $1 AND id <> $2::bigint LIMIT 1`, [slug, excludeId]);
    return rows.length > 0;
  }
  const { rows } = await query(`SELECT 1 FROM posts WHERE slug = $1 LIMIT 1`, [slug]);
  return rows.length > 0;
}

export async function insertMedia(opts: { path: string; mime: string; width?: number; height?: number }): Promise<string> {
  // Real WP media all have positive wp_id (imported from wp_posts.ID); negative
  // epoch-ms guarantees no collision without a second sequence.
  const wpId = -Date.now();
  const { rows } = await query<{ id: number }>(
    `INSERT INTO media (wp_id, path, mime, width, height, uploaded_at)
     VALUES ($1, $2, $3, $4, $5, now())
     RETURNING id`,
    [wpId, opts.path, opts.mime, opts.width ?? null, opts.height ?? null]
  );
  return String(rows[0].id);
}

export async function createPost(opts: {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  status: "published" | "draft";
  authorId: string;
  // Every category this post belongs to (post_categories, the real
  // many-to-many set) - exactly one flagged primary, which becomes
  // posts.primary_category_id and therefore the post's URL prefix.
  categoryIds: string[];
  primaryCategoryId: string;
  featuredMediaId?: string;
}): Promise<{ id: string; slug: string; categorySlug: string }> {
  const wpId = -Date.now();
  const publishedAt = opts.status === "published" ? new Date() : null;
  const { rows } = await query<{ id: number }>(
    `INSERT INTO posts (wp_id, slug, title, excerpt, content, status, author_id, primary_category_id, featured_media_id, published_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING id`,
    [
      wpId,
      opts.slug,
      opts.title,
      opts.excerpt || null,
      opts.content,
      opts.status,
      opts.authorId,
      opts.primaryCategoryId,
      opts.featuredMediaId ?? null,
      publishedAt,
    ]
  );
  const postId = rows[0].id;
  // Every selected category goes into the junction table, not just the
  // primary one - this is the actual multi-category assignment. Rendering
  // today only reads primary_category_id (see the comment on getPosts in
  // lib/posts.ts), but the full set is real, queryable data regardless.
  for (const categoryId of opts.categoryIds) {
    await query(`INSERT INTO post_categories (post_id, category_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [
      postId,
      categoryId,
    ]);
  }
  const { rows: catRows } = await query<{ slug: string }>(`SELECT slug FROM categories WHERE id = $1`, [
    opts.primaryCategoryId,
  ]);
  return { id: String(postId), slug: opts.slug, categorySlug: catRows[0]?.slug ?? "" };
}

export interface AdminPostDetail {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: "published" | "draft" | "private";
  authorId: string;
  authorName: string;
  categories: { name: string; isPrimary: boolean }[];
  featuredMediaId: string | null;
  coverImage: string | null;
  publishedAt: string | null;
  updatedAt: string;
}

export async function getAdminPostById(id: string): Promise<AdminPostDetail | null> {
  if (!id || isNaN(Number(id))) return null;

  const { rows } = await query<{
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    content: string;
    status: string;
    author_id: number | null;
    author_name: string | null;
    featured_media_id: number | null;
    media_path: string | null;
    meta_cover_image: string | null;
    published_at: string | null;
    updated_at: string;
    primary_category_id: number | null;
  }>(
    `SELECT p.id, p.title, p.slug, p.excerpt, p.content, p.status,
            p.author_id, a.display_name AS author_name,
            p.featured_media_id, m.path AS media_path,
            p.meta->>'coverImage' AS meta_cover_image,
            p.published_at, p.updated_at, p.primary_category_id
     FROM posts p
     LEFT JOIN authors a ON a.id = p.author_id
     LEFT JOIN media m ON m.id = p.featured_media_id
     WHERE p.id = $1
     LIMIT 1`,
    [id]
  );

  const post = rows[0];
  if (!post) return null;

  const { rows: catRows } = await query<{
    name: string;
    is_primary: boolean;
  }>(
    `SELECT c.name,
            (c.id = $2) AS is_primary
     FROM categories c
     WHERE c.id IN (
       SELECT category_id FROM post_categories WHERE post_id = $1
       UNION
       SELECT primary_category_id FROM posts WHERE id = $1 AND primary_category_id IS NOT NULL
     )
     ORDER BY (c.id = $2) DESC, c.name ASC`,
    [id, post.primary_category_id]
  );

  const categories = catRows.map((r) => ({
    name: r.name,
    isPrimary: Boolean(r.is_primary),
  }));

  if (categories.length > 0 && !categories.some((c) => c.isPrimary)) {
    categories[0].isPrimary = true;
  }

  const WP_UPLOADS_BASE = "/wp-content/uploads";
  const coverImage = post.media_path
    ? `${WP_UPLOADS_BASE}/${post.media_path.replace(/^\//, "")}`
    : post.meta_cover_image || null;

  return {
    id: String(post.id),
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt ?? "",
    content: post.content,
    status: post.status as AdminPostDetail["status"],
    authorId: post.author_id ? String(post.author_id) : "",
    authorName: post.author_name ?? "Unknown",
    categories,
    featuredMediaId: post.featured_media_id ? String(post.featured_media_id) : null,
    coverImage,
    publishedAt: post.published_at,
    updatedAt: post.updated_at,
  };
}

export async function updatePost(opts: {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  status: "published" | "draft" | "private";
  authorId: string;
  categoryIds: string[];
  primaryCategoryId: string;
  featuredMediaId?: string | null;
}): Promise<{ id: string; slug: string; categorySlug: string }> {
  const isPublished = opts.status === "published";
  const shouldClearMetaCover = opts.featuredMediaId !== undefined;

  const { rows } = await query<{ id: number; slug: string }>(
    `UPDATE posts
     SET title = $1,
         slug = $2,
         excerpt = $3,
         content = $4,
         status = $5::post_status,
         author_id = $6::bigint,
         primary_category_id = $7::bigint,
         featured_media_id = $8::bigint,
         published_at = ${isPublished ? "COALESCE(published_at, now())" : "published_at"},
         meta = ${shouldClearMetaCover ? "meta - 'coverImage'" : "meta"},
         updated_at = now()
     WHERE id = $9::bigint
     RETURNING id, slug`,
    [
      opts.title,
      opts.slug,
      opts.excerpt || null,
      opts.content,
      opts.status,
      opts.authorId,
      opts.primaryCategoryId,
      opts.featuredMediaId ?? null,
      opts.id,
    ]
  );

  if (!rows[0]) {
    throw new Error(`Post with id ${opts.id} not found`);
  }

  await query(`DELETE FROM post_categories WHERE post_id = $1`, [opts.id]);
  for (const categoryId of opts.categoryIds) {
    await query(
      `INSERT INTO post_categories (post_id, category_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [opts.id, categoryId]
    );
  }

  const { rows: catRows } = await query<{ slug: string }>(
    `SELECT slug FROM categories WHERE id = $1`,
    [opts.primaryCategoryId]
  );

  return { id: String(rows[0].id), slug: rows[0].slug, categorySlug: catRows[0]?.slug ?? "" };
}

export async function deletePost(id: string): Promise<boolean> {
  if (!id || isNaN(Number(id))) return false;
  const result = await query(`DELETE FROM posts WHERE id = $1::bigint`, [id]);
  return (result.rowCount ?? 0) > 0;
}

export interface AuthorWithAuth {
  id: string;
  name: string;
  slug: string;
  passwordHash: string | null;
}

export async function getAuthorByName(name: string): Promise<AuthorWithAuth | null> {
  if (!name || !name.trim()) return null;
  await ensureAuthorPasswordColumn();
  const { rows } = await query<{
    id: number;
    display_name: string;
    slug: string;
    password_hash: string | null;
  }>(
    `SELECT id, display_name, slug, password_hash FROM authors WHERE lower(display_name) = lower($1) LIMIT 1`,
    [name.trim()]
  );
  if (!rows[0]) return null;
  return {
    id: String(rows[0].id),
    name: rows[0].display_name,
    slug: rows[0].slug,
    passwordHash: rows[0].password_hash,
  };
}

export async function getAuthorById(id: string): Promise<AuthorWithAuth | null> {
  if (!id || isNaN(Number(id))) return null;
  await ensureAuthorPasswordColumn();
  const { rows } = await query<{
    id: number;
    display_name: string;
    slug: string;
    password_hash: string | null;
  }>(
    `SELECT id, display_name, slug, password_hash FROM authors WHERE id = $1::bigint LIMIT 1`,
    [id]
  );
  if (!rows[0]) return null;
  return {
    id: String(rows[0].id),
    name: rows[0].display_name,
    slug: rows[0].slug,
    passwordHash: rows[0].password_hash,
  };
}

export async function setAuthorPassword(authorId: string, passwordHash: string): Promise<boolean> {
  if (!authorId || isNaN(Number(authorId))) return false;
  await ensureAuthorPasswordColumn();
  const result = await query(`UPDATE authors SET password_hash = $1 WHERE id = $2::bigint`, [
    passwordHash,
    authorId,
  ]);
  return (result.rowCount ?? 0) > 0;
}

export interface AuthorAuthStatusRow {
  id: string;
  name: string;
  slug: string;
  hasCustomPassword: boolean;
  postCount: number;
}

export async function getAllAuthorsWithAuthStatus(): Promise<AuthorAuthStatusRow[]> {
  await ensureAuthorPasswordColumn();
  const { rows } = await query<{
    id: number;
    display_name: string;
    slug: string;
    has_custom_password: boolean;
    post_count: string;
  }>(
    `SELECT a.id, a.display_name, a.slug,
            (a.password_hash IS NOT NULL AND a.password_hash <> '') AS has_custom_password,
            COUNT(p.id) AS post_count
     FROM authors a
     LEFT JOIN posts p ON p.author_id = a.id
     GROUP BY a.id, a.display_name, a.slug, a.password_hash
     ORDER BY a.display_name ASC`
  );
  return rows.map((r) => ({
    id: String(r.id),
    name: r.display_name,
    slug: r.slug,
    hasCustomPassword: Boolean(r.has_custom_password),
    postCount: Number(r.post_count || 0),
  }));
}

