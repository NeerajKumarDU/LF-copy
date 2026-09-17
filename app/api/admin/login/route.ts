import { NextRequest, NextResponse } from "next/server";
import {
  checkPassword,
  createAdminSessionToken,
  createAuthorSessionToken,
  ADMIN_COOKIE_NAME,
  ADMIN_COOKIE_MAX_AGE_SECONDS,
} from "@/lib/adminAuth";
import { getAuthorByName } from "@/lib/admin-posts";
import { verifyAuthorPassword } from "@/lib/passwords";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const role = body.role || "admin";
  const password = body.password;

  if (!password || typeof password !== "string") {
    return NextResponse.json({ error: "Password is required" }, { status: 400 });
  }

  if (role === "author") {
    const authorName = body.authorName;
    if (!authorName || typeof authorName !== "string" || !authorName.trim()) {
      return NextResponse.json({ error: "Author name is required" }, { status: 400 });
    }

    const author = await getAuthorByName(authorName.trim());
    if (!author) {
      return NextResponse.json(
        { error: `Author "${authorName.trim()}" not found. Please check spelling.` },
        { status: 401 }
      );
    }

    const isValid = verifyAuthorPassword(password, author.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Incorrect author password" }, { status: 401 });
    }

    const token = await createAuthorSessionToken({ id: author.id, name: author.name });
    const res = NextResponse.json({ ok: true, role: "author", authorName: author.name });
    res.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: ADMIN_COOKIE_MAX_AGE_SECONDS,
      path: "/",
    });
    return res;
  }

  // Default: Admin login
  if (!checkPassword(password)) {
    return NextResponse.json({ error: "Incorrect admin password" }, { status: 401 });
  }

  const token = await createAdminSessionToken();
  const res = NextResponse.json({ ok: true, role: "admin" });
  res.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ADMIN_COOKIE_MAX_AGE_SECONDS,
    path: "/",
  });
  return res;
}
