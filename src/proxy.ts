import { NextResponse, type NextRequest } from "next/server";

/** Visitors without a session see the marketing page instead of being bounced to /login. */
export function proxy(request: NextRequest) {
  if (!request.cookies.has("cc_session")) return NextResponse.redirect(new URL("/welcome", request.url));
  return NextResponse.next();
}

export const config = { matcher: "/" };
