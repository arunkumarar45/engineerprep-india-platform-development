import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Lightweight session check used by client components to decide whether
 * to render a Dashboard link or Login/Sign-Up buttons, without blocking
 * static page generation.
 *
 * Returns 200 with { loggedIn: true, role } when authenticated,
 * or 401 with { loggedIn: false } when not.
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ loggedIn: false }, { status: 401 });
    }
    return NextResponse.json(
      { loggedIn: true, role: user.role },
      {
        status: 200,
        headers: {
          // Allow browser to cache this for 10 s to avoid per-navigation round trips
          "Cache-Control": "private, max-age=10",
        },
      },
    );
  } catch {
    return NextResponse.json({ loggedIn: false }, { status: 401 });
  }
}
