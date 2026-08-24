import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  response.headers.set("x-security-pwa", "enabled");

  const path = request.nextUrl.pathname;
  const isAuthPage = path.startsWith("/login");
  const isProtected = path.startsWith("/dashboard") || path.startsWith("/api/companies") || path.startsWith("/api/sync");

  // Soft protection: cookies are refreshed; pages still work in demo mode.
  if (isProtected && !isAuthPage) {
    response.headers.set("x-security-protected", "1");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
