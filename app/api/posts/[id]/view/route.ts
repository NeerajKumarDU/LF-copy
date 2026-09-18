import { NextRequest, NextResponse } from "next/server";
import { incrementPostViewCount } from "@/lib/posts";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const ok = await incrementPostViewCount(params.id);
  if (!ok) return NextResponse.json({ ok: false }, { status: 404 });
  return NextResponse.json({ ok: true });
}
