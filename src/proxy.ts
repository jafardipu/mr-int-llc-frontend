import { NextResponse, type NextRequest } from "next/server";
import { accessTokenCookie } from "@/lib/auth-cookies";

const authPages = [
  "/login",
  "/sign-up",
  "/verify-otp",
  "/forgot-password",
  "/reset-password",
];

const prepRequestPage = "/3pl-prep-service/prep-request";

export function proxy(request: NextRequest) {
  const isLoggedIn = Boolean(request.cookies.get(accessTokenCookie)?.value);
  const { pathname } = request.nextUrl;
  const isUserRoute = pathname === "/user" || pathname.startsWith("/user/");
  const isAuthPage = authPages.some(
    (page) => pathname === page || pathname.startsWith(`${page}/`),
  );
  // Submitting a prep request needs an account; sign in before picking files.
  const needsLogin = isUserRoute || pathname === prepRequestPage;

  if (needsLogin && !isLoggedIn) {
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
    "/3pl-prep-service/prep-request",
    "/login",
    "/sign-up",
    "/verify-otp",
    "/forgot-password",
    "/reset-password",
  ],
};
