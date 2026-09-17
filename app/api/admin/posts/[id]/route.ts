import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentSessionUser } from "@/lib/adminAuth";
import {
  getAdminPostById,
  updatePost,
  deletePost,
  isSlugTaken,
  findOrCreateAuthorByName,
  findOrCreateCategoryByName,
} from "@/lib/admin-posts";

interface CategoryInput {
  name: string;
  isPrimary: boolean;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const post = await getAdminPostById(params.id);
  if (!post) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  // If author, verify post ownership
  if (user.role === "author" && post.authorId !== user.authorId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ ok: true, post });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const postId = params.id;
  const existingPost = await getAdminPostById(postId);
  if (!existingPost) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const { title, slug, excerpt, content, status, categories, featuredMediaId } = body;
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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existingPost = await getAdminPostById(params.id);
  if (!existingPost) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  if (user.role === "author" && existingPost.authorId !== user.authorId) {
    return NextResponse.json({ error: "You can only delete your own articles" }, { status: 403 });
  }

  const deleted = await deletePost(params.id);
  if (!deleted) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }
  revalidatePath("/");
  revalidatePath("/category/[slug]", "page");
  revalidatePath("/[...slug]", "page");
  revalidatePath("/admin");
  return NextResponse.json({ ok: true });
}
