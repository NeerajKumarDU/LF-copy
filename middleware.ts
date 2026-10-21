import { NextResponse, type NextRequest } from "next/server";
import {
  getSessionUser,
  renewSessionToken,
  peekSessionRole,
  ADMIN_COOKIE_NAME,
  ADMIN_COOKIE_MAX_AGE_SECONDS,
} from "@/lib/adminAuth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Login page/endpoint must stay reachable while logged out.
  if (pathname === "/admin/login" || pathname === "/api/admin/login") {
    return NextResponse.next();
  }

  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const user = await getSessionUser(token);
  if (user) {
    // Sliding session: every authenticated request re-signs the token with a
    // fresh 7-day expiry, so staying active keeps you logged in indefinitely
    // instead of getting cut off exactly 7 days after the original login.
    const res = NextResponse.next();
    const renewed = await renewSessionToken(user);
    res.cookies.set(ADMIN_COOKIE_NAME, renewed, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: ADMIN_COOKIE_MAX_AGE_SECONDS,
      path: "/",
    });
    return res;
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
