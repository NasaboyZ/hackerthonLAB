import { NextResponse, type NextRequest } from "next/server";

const protectedPaths = ["/places", "/logbook", "/expeditions", "/profile", "/settings"];

export function proxy(request: NextRequest) {
  const isProtected = protectedPaths.some(path => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`));
  if (!isProtected || request.cookies.has("magnetrail_session")) return NextResponse.next();
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("returnUrl", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = { matcher: ["/places/:path*", "/logbook/:path*", "/expeditions/:path*", "/profile/:path*", "/settings/:path*"] };
