import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const { data: { session } } = await supabase.auth.getSession();

  const publicPaths = ["/login", "/inscription", "/api/auth/otp", "/api/auth/otp-verify"];
  const isPublic = publicPaths.some(p => req.nextUrl.pathname.startsWith(p));

  // Pas de session → rediriger vers login (sauf chemins publics)
  if (!session && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Session active → bloquer accès aux pages auth
  if (session && (req.nextUrl.pathname === "/login" || req.nextUrl.pathname === "/inscription")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
