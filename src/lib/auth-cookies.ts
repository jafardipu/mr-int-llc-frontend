export const accessTokenCookie = "accessToken";
export const refreshTokenCookie = "refreshToken";

const accessTokenMaxAge = 30 * 24 * 60 * 60;
const refreshTokenMaxAge = 30 * 24 * 60 * 60;

export function authCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export const accessTokenCookieOptions = authCookieOptions(accessTokenMaxAge);
export const refreshTokenCookieOptions = authCookieOptions(refreshTokenMaxAge);
