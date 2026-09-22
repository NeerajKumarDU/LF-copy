import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentSessionUser } from "@/lib/adminAuth";
import { rejectAuthorRequest } from "@/lib/author-requests";
import { sendMail } from "@/lib/mailer";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const reason = typeof body?.reason === "string" ? body.reason : undefined;

  const result = await rejectAuthorRequest(params.id, reason);
  if (!result) {
    return NextResponse.json({ error: "Request not found or already decided" }, { status: 404 });
  }

  try {
    await sendMail({
      to: result.email,
      subject: "Update on your LawsForum author request",
      text: `Thanks for your interest in writing for LawsForum. We won't be moving forward with your author request at this time.${
        reason ? `\n\nNote from the team: ${reason}` : ""
      }`,
      html: `
        <p>Thanks for your interest in writing for LawsForum. We won't be moving forward with your author request at this time.</p>
        ${reason ? `<p style="color:#64748b">Note from the team: ${reason}</p>` : ""}
      `,
    });
  } catch (err) {
    console.error("Failed to send author-rejection email:", err);
  }

  revalidatePath("/admin/author-requests");
  return NextResponse.json({ ok: true });
}
