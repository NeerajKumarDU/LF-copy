import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentSessionUser } from "@/lib/adminAuth";
import {
  createPost,
  updatePost,
  deletePost,
  getAdminPostById,
  isSlugTaken,
  findOrCreateAuthorByName,
  findOrCreateCategoryByName,
} from "@/lib/admin-posts";

interface CategoryInput {
  name: string;
  isPrimary: boolean;
}

export async function POST(req: NextRequest) {
  const user = await getCurrentSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const { title, slug, excerpt, content, status, categories, featuredMediaId } = body;
  let authorName = body.authorName;

  // Authors can only post under their own name and can only save drafts
  let finalStatus: "draft" | "published" = status;
  if (user.role === "author") {
    if (!user.authorId || !user.authorName) {
      return NextResponse.json({ error: "Invalid author session" }, { status: 403 });
    }
    authorName = user.authorName;
    finalStatus = "draft";
  }

  if (
    typeof title !== "string" || !title.trim() ||
    typeof slug !== "string" || !slug.trim() ||
    typeof content !== "string" || !content.trim() ||
    typeof authorName !== "string" || !authorName.trim() ||
    !Array.isArray(categories) || categories.length === 0
  ) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const cats = categories as CategoryInput[];
  if (!cats.every((c) => typeof c?.name === "string" && c.name.trim())) {
    return NextResponse.json({ error: "Every category needs a name" }, { status: 400 });
  }
  const primaryCats = cats.filter((c) => c.isPrimary);
  if (primaryCats.length !== 1) {
    return NextResponse.json({ error: "Exactly one category must be marked primary" }, { status: 400 });
  }
  if (finalStatus !== "published" && finalStatus !== "draft") {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  // Re-check server-side
  if (await isSlugTaken(slug)) {
    return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
  }

  const authorId = user.role === "author" ? user.authorId! : await findOrCreateAuthorByName(authorName);
  const resolvedByName = new Map<string, { id: string; slug: string }>();
  for (const c of cats) {
    const key = c.name.trim().toLowerCase();
    if (!resolvedByName.has(key)) {
      resolvedByName.set(key, await findOrCreateCategoryByName(c.name));
    }
  }
  const categoryIds = [...new Set(cats.map((c) => resolvedByName.get(c.name.trim().toLowerCase())!.id))];
  const primaryCategoryId = resolvedByName.get(primaryCats[0].name.trim().toLowerCase())!.id;

  const post = await createPost({
    title: title.trim(),
    slug: slug.trim(),
    excerpt: typeof excerpt === "string" ? excerpt.trim() : undefined,
    content,
    status: finalStatus,
    authorId,
    categoryIds,
    primaryCategoryId,
    featuredMediaId: featuredMediaId ? String(featuredMediaId) : undefined,
  });
  revalidatePath("/");
  revalidatePath("/category/[slug]", "page");
  revalidatePath("/[...slug]", "page");
  revalidatePath("/admin");
  if (post.categorySlug) {
    revalidatePath(`/category/${post.categorySlug}`);
    revalidatePath(`/${post.categorySlug}/${post.slug}`);
  }
  return NextResponse.json({ ok: true, post });
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const { id, title, slug, excerpt, content, status, categories, featuredMediaId } = body;
  if (!id || (typeof id !== "string" && typeof id !== "number")) {
    return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
  }
  const postId = String(id);

  const existingPost = await getAdminPostById(postId);
  if (!existingPost) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  let authorName = body.authorName;
  let finalStatus = status;

  // Authors can only edit their own articles and can only save as drafts
  if (user.role === "author") {
    if (!user.authorId || existingPost.authorId !== user.authorId) {
      return NextResponse.json({ error: "You can only edit your own articles" }, { status: 403 });
    }
    authorName = user.authorName;
    finalStatus = "draft";
  }

  if (
    typeof title !== "string" || !title.trim() ||
    typeof slug !== "string" || !slug.trim() ||
    typeof content !== "string" || !content.trim() ||
    typeof authorName !== "string" || !authorName.trim() ||
    !Array.isArray(categories) || categories.length === 0
  ) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const cats = categories as CategoryInput[];
  if (!cats.every((c) => typeof c?.name === "string" && c.name.trim())) {
    return NextResponse.json({ error: "Every category needs a name" }, { status: 400 });
  }
  const primaryCats = cats.filter((c) => c.isPrimary);
  if (primaryCats.length !== 1) {
    return NextResponse.json({ error: "Exactly one category must be marked primary" }, { status: 400 });
  }
  if (finalStatus !== "published" && finalStatus !== "draft" && finalStatus !== "private") {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  if (await isSlugTaken(slug.trim(), postId)) {
    return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
  }

  const authorId = user.role === "author" ? user.authorId! : await findOrCreateAuthorByName(authorName);
  const resolvedByName = new Map<string, { id: string; slug: string }>();
  for (const c of cats) {
    const key = c.name.trim().toLowerCase();
    if (!resolvedByName.has(key)) {
      resolvedByName.set(key, await findOrCreateCategoryByName(c.name));
    }
  }
  const categoryIds = [...new Set(cats.map((c) => resolvedByName.get(c.name.trim().toLowerCase())!.id))];
  const primaryCategoryId = resolvedByName.get(primaryCats[0].name.trim().toLowerCase())!.id;

  try {
    const post = await updatePost({
      id: postId,
      title: title.trim(),
      slug: slug.trim(),
      excerpt: typeof excerpt === "string" ? excerpt.trim() : undefined,
      content,
      status: finalStatus,
      authorId,
      categoryIds,
      primaryCategoryId,
      featuredMediaId: featuredMediaId === null ? null : featuredMediaId ? String(featuredMediaId) : undefined,
    });
    revalidatePath("/");
    revalidatePath("/category/[slug]", "page");
    revalidatePath("/[...slug]", "page");
    revalidatePath("/admin");
    if (post.categorySlug) {
      revalidatePath(`/category/${post.categorySlug}`);
      revalidatePath(`/${post.categorySlug}/${post.slug}`);
    }
    return NextResponse.json({ ok: true, post });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to update article" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let id = req.nextUrl.searchParams.get("id")?.trim();
  if (!id) {
    const body = await req.json().catch(() => null);
    if (body?.id) id = String(body.id).trim();
  }
  if (!id) {
    return NextResponse.json({ error: "Missing article ID" }, { status: 400 });
  }

  if (user.role === "author") {
    const existingPost = await getAdminPostById(id);
    if (!existingPost) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }
    if (existingPost.authorId !== user.authorId) {
      return NextResponse.json({ error: "You can only delete your own articles" }, { status: 403 });
    }
  }

  const deleted = await deletePost(id);
  if (!deleted) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }
  revalidatePath("/");
  revalidatePath("/category/[slug]", "page");
  revalidatePath("/[...slug]", "page");
  revalidatePath("/admin");
  return NextResponse.json({ ok: true });
}
