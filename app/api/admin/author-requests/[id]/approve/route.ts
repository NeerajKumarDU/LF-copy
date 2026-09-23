import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentSessionUser } from "@/lib/adminAuth";
import { approveAuthorRequest } from "@/lib/author-requests";
import { sendMail } from "@/lib/mailer";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await approveAuthorRequest(params.id);
  if (!result) {
    return NextResponse.json({ error: "Request not found or already decided" }, { status: 404 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "lawsforum.com";
  // if (!siteUrl) {
  //   console.error("NEXT_PUBLIC_SITE_URL is not configured");
  //   return NextResponse.json(
  //     { error: "Server configuration error" },
  //     { status: 500 }
  //   );
  // }

  const loginUrl = `${siteUrl.replace(/\/$/, "")}/author/login`;

  try {
    await sendMail({
      to: result.email,
      subject: "You're approved to write for LawsForum",
      text: `Your author request was approved.\n\nLog in at ${loginUrl}\nAuthor name: ${result.authorName}\nTemporary password: ${result.tempPassword}\n\nPlease change your password after logging in.`,
      html: `
        <p>Good news - your author request was approved.</p>
        <p><a href="${loginUrl}">Log in here</a> using:</p>
        <ul>
          <li>Author name: <strong>${result.authorName}</strong></li>
          <li>Temporary password: <strong>${result.tempPassword}</strong></li>
        </ul>
        <p style="color:#64748b;font-size:12px">Please change your password after logging in (top-right menu).</p>
      `,
    });
  } catch (err) {
    console.error("Failed to send author-approval email:", err);
    // Account is already created - don't fail the request, just surface it so the
    // admin knows to relay the credentials some other way.
    return NextResponse.json({ ok: true, emailFailed: true });
  }

  revalidatePath("/admin/author-requests");
  revalidatePath("/admin/authors");
  return NextResponse.json({ ok: true });
}
