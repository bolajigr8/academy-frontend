import { NextResponse, type NextRequest } from "next/server"

import { ROLE_COOKIE, TOKEN_COOKIE } from "@/lib/api/session-cookies"

/*
 * Route guard for the signed-in areas (api mode only).
 * An optimistic check on the session cookies, as the Next.js authentication
 * guide recommends: no token -> /login?next=<page>; an academy account on
 * /family or an applicant on /club -> its own dashboard. The backend still
 * checks every request (401 / 403), so this only saves a wasted page load.
 *
 * The browser writes the three session cookies one after another, and the
 * first request after sign-in can leave before all of them are attached (seen
 * in Chromium: token present, role missing). So a missing role cookie is never
 * treated as "the wrong role": the page is let through and the app shell, which
 * reads the cookies directly, sends a wrong account type to its own area.
 */
const API_MODE =
  process.env.NEXT_PUBLIC_DATA_MODE !== "mock" &&
  Boolean(process.env.NEXT_PUBLIC_API_URL)

export function proxy(request: NextRequest) {
  if (!API_MODE) return NextResponse.next()
  const { pathname, search } = request.nextUrl
  const adminArea = pathname === "/admin" || pathname.startsWith("/admin/")
  if (adminArea) {
    if (pathname === "/admin/login") return NextResponse.next()
    const adminToken = request.cookies.get(TOKEN_COOKIE)?.value
    const adminRole = request.cookies.get(ROLE_COOKIE)?.value
    // only an admin session opens /admin (a missing role cookie is checked again by the admin shell)
    if (!adminToken || (adminRole && adminRole !== "admin")) {
      const url = new URL("/admin/login", request.url)
      url.searchParams.set("next", pathname + search)
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }
  const club = pathname === "/club" || pathname.startsWith("/club/")
  const token = request.cookies.get(TOKEN_COOKIE)?.value
  const role = request.cookies.get(ROLE_COOKIE)?.value

  if (!token) {
    const url = new URL("/login", request.url)
    url.searchParams.set("next", pathname + search)
    if (club) url.searchParams.set("role", "academy")
    return NextResponse.redirect(url)
  }
  if (!role) return NextResponse.next()
  if (role === "admin")
    return NextResponse.redirect(new URL("/admin", request.url))
  if (club && role !== "academy") {
    return NextResponse.redirect(new URL("/family/dashboard", request.url))
  }
  if (!club && role === "academy") {
    return NextResponse.redirect(new URL("/club/dashboard", request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/club/:path*", "/family/:path*", "/admin/:path*", "/admin"],
}
