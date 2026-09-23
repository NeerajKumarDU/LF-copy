import { NextResponse, type NextRequest } from "next/server";
import { isValidSessionToken, peekSessionRole, ADMIN_COOKIE_NAME } from "@/lib/adminAuth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Login page/endpoint must stay reachable while logged out.
  if (pathname === "/admin/login" || pathname === "/api/admin/login") {
    return NextResponse.next();
  }

  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (await isValidSessionToken(token)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // /admin/(dashboard) is shared by both roles - an expired-but-otherwise-valid
  // token still tells us which login page to send them back to, so an
  // author's lapsed session doesn't get bounced at the admin-only login.
  const role = await peekSessionRole(token);
  const loginUrl = new URL(role === "author" ? "/author/login" : "/admin/login", req.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
