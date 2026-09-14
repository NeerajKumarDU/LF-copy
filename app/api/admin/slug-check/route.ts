import { NextRequest, NextResponse } from "next/server";
import { isSlugTaken } from "@/lib/admin-posts";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug")?.trim();
  const excludeId = req.nextUrl.searchParams.get("excludeId")?.trim() || undefined;
  if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  const taken = await isSlugTaken(slug, excludeId);
  return NextResponse.json({ taken });
}
