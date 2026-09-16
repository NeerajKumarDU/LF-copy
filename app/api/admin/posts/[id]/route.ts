import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
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
  const post = await getAdminPostById(params.id);
  if (!post) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, post });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const postId = params.id;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const { title, slug, excerpt, content, status, authorName, categories, featuredMediaId } = body;

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
  if (status !== "published" && status !== "draft" && status !== "private") {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  if (await isSlugTaken(slug.trim(), postId)) {
    return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
  }

  const authorId = await findOrCreateAuthorByName(authorName);
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
      status,
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
