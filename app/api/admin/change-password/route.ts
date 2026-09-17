import { NextRequest, NextResponse } from "next/server";
import { getCurrentSessionUser } from "@/lib/adminAuth";
import { getAuthorById, setAuthorPassword } from "@/lib/admin-posts";
import { hashPassword, verifyAuthorPassword } from "@/lib/passwords";

export async function POST(req: NextRequest) {
  const user = await getCurrentSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  // Case 1: Author changing their own password
  if (user.role === "author") {
    const { currentPassword, newPassword } = body;
    if (!currentPassword || typeof currentPassword !== "string") {
      return NextResponse.json({ error: "Current password is required" }, { status: 400 });
    }
    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 4) {
      return NextResponse.json(
        { error: "New password must be at least 4 characters long" },
        { status: 400 }
      );
    }

    if (!user.authorId) {
      return NextResponse.json({ error: "Invalid author session" }, { status: 400 });
    }

    const author = await getAuthorById(user.authorId);
    if (!author) {
      return NextResponse.json({ error: "Author profile not found" }, { status: 404 });
    }

    const isCurrentValid = verifyAuthorPassword(currentPassword, author.passwordHash);
    if (!isCurrentValid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    const newHash = hashPassword(newPassword);
    const updated = await setAuthorPassword(author.id, newHash);
    if (!updated) {
      return NextResponse.json({ error: "Failed to update password in database" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: "Password updated successfully" });
  }

  // Case 2: Admin changing an author's password directly
  if (user.role === "admin") {
    const { authorId, newPassword } = body;
    if (!authorId || (typeof authorId !== "string" && typeof authorId !== "number")) {
      return NextResponse.json({ error: "Author ID is required" }, { status: 400 });
    }
    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 4) {
      return NextResponse.json(
        { error: "New password must be at least 4 characters long" },
        { status: 400 }
      );
    }

    const author = await getAuthorById(String(authorId));
    if (!author) {
      return NextResponse.json({ error: "Author not found" }, { status: 404 });
    }

    const newHash = hashPassword(newPassword);
    const updated = await setAuthorPassword(author.id, newHash);
    if (!updated) {
      return NextResponse.json({ error: "Failed to update password in database" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: `Password for author "${author.name}" updated successfully`,
    });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
