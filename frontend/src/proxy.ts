import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Protected paths that require admin auth
  const protectedPaths = ["/admin", "/api/admin"];

  // If accessing a protected path
  if (protectedPaths.some((p) => pathname.startsWith(p))) {
    if (!user) {
      const url = new URL("/login", request.url);
      url.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(url);
    }

    // Check if the user is an admin by validating against env variable
    const adminEmailsConfig = process.env.ADMIN_EMAILS || "";
    const adminEmails = adminEmailsConfig
      .split(",")
      .map((e) => e.trim().toLowerCase());

    // Exclude API routes from redirecting HTML so they just get a JSON 401 instead (if preferred)
    // but a redirect is standard for now safely
    if (user.email && !adminEmails.includes(user.email.toLowerCase())) {
      const url = new URL("/login", request.url);
      url.searchParams.set("error", "unauthorized_admin"); // specific error code
      return NextResponse.redirect(url);
    }
  }

  // If user IS logged in and trying to go to /login, redirect to dashboard
  if (user && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (svg, png, etc)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
