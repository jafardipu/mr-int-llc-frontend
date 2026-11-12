import { NextResponse, type NextRequest } from "next/server";
import { accessTokenCookie } from "@/lib/auth-cookies";

const authPages = [
  "/login",
  "/sign-up",
  "/verify-otp",
  "/forgot-password",
  "/reset-password",
];

export function proxy(request: NextRequest) {
  const isLoggedIn = Boolean(request.cookies.get(accessTokenCookie)?.value);
  const { pathname } = request.nextUrl;
  const isUserRoute = pathname === "/user" || pathname.startsWith("/user/");
  const isAuthPage = authPages.some(
    (page) => pathname === page || pathname.startsWith(`${page}/`),
  );

  if (isUserRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/user/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/user",
    "/user/:path*",
    "/login",
    "/sign-up",
    "/verify-otp",
    "/forgot-password",
    "/reset-password",
  ],
};
