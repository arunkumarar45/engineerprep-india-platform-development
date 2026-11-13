import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const ACCESS_COOKIE = "epi_access";

function getAccessSecret(): Uint8Array {
  const secret = process.env.JWT_ACCESS_SECRET ?? "engineerprep-dev-access-secret-change-me";
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Admin UI routes protection
  const isAdminPage = pathname.startsWith("/admin");
  const isStudentProtectedPage =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/profile");

  const isAdminApi = pathname.startsWith("/api/v1/admin");

  if (!isAdminPage && !isStudentProtectedPage && !isAdminApi) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ACCESS_COOKIE)?.value;

  if (!token) {
    if (isAdminApi) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 },
      );
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, getAccessSecret(), {
      issuer: "engineerprep-india",
      audience: "engineerprep-india-web",
    });

    const role = (payload as { role?: string }).role;

    // Admin authorization check
    if (isAdminPage || isAdminApi) {
      if (role !== "ADMIN") {
        if (isAdminApi) {
          return NextResponse.json(
            { success: false, message: "Administrator access required" },
            { status: 403 },
          );
        }
        // Redirect non-admin students away from admin pages
        const dashboardUrl = new URL("/dashboard", request.url);
        return NextResponse.redirect(dashboardUrl);
      }
    }

    return NextResponse.next();
  } catch {
    // Expired or invalid token
    if (isAdminApi) {
      return NextResponse.json(
        { success: false, message: "Session expired or invalid" },
        { status: 401 },
      );
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/settings/:path*",
    "/profile/:path*",
    "/api/v1/admin/:path*",
  ],
};

