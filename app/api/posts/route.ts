// Backs EditorialSection's numbered pagination - page/sort are pushed down to
// Postgres (lib/posts.ts ORDER_BY + OFFSET) rather than re-sorting a fixed
// in-memory batch, so page N is always correct regardless of what the initial
// SSR batch happened to contain.
import { NextRequest, NextResponse } from "next/server";
import { getPosts, getPostsCount } from "@/lib/posts";

const MAX_LIMIT = 30;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sortParam = searchParams.get("sort");
  const sort = sortParam === "hot" || sortParam === "top" ? sortParam : "latest";
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(searchParams.get("limit")) || 10));
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const offset = (page - 1) * limit;
  const categorySlug = searchParams.get("category") || undefined;
  const authorSlug = searchParams.get("author") || undefined;
  const searchQuery = searchParams.get("q") || undefined;

  const filter = { categorySlug, authorSlug, query: searchQuery };
  const [posts, total] = await Promise.all([
    getPosts({ ...filter, sort, limit, offset }),
    getPostsCount(filter),
  ]);
  return NextResponse.json({ posts, page, totalPages: Math.max(1, Math.ceil(total / limit)) });
}
