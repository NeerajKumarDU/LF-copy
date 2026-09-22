import { NextRequest, NextResponse } from "next/server";
import { createAuthorRequest } from "@/lib/author-requests";
import { sendMail } from "@/lib/mailer";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const { name, email, message } = body;
  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }
  if (message !== undefined && typeof message !== "string") {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  const { token } = await createAuthorRequest({ name, email, message });
  const verifyUrl = `${req.nextUrl.origin}/become-author/verify?token=${token}`;

  try {
    await sendMail({
      to: email.trim(),
      subject: "Verify your email - LawsForum author request",
      text: `Confirm your author request for LawsForum by opening this link: ${verifyUrl}\n\nThis link expires in 24 hours. If you didn't request this, you can ignore this email.`,
      html: `
        <p>Thanks for requesting author access on LawsForum.</p>
        <p><a href="${verifyUrl}">Click here to verify your email</a> and move your request into the review queue.</p>
        <p style="color:#64748b;font-size:12px">This link expires in 24 hours. If you didn't request this, you can ignore this email.</p>
      `,
    });
  } catch (err) {
    console.error("Failed to send author-request verification email:", err);
    return NextResponse.json({ error: "Could not send the verification email. Please try again shortly." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
