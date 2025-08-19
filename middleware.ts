import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    // Additional middleware logic can go here if needed
    console.log("Middleware running for:", req.nextUrl.pathname);
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;

        // Always allow these routes without authentication
        if (
          pathname.startsWith("/api/auth") ||
          pathname.startsWith("/signin") ||
          pathname === "/" ||
          pathname.startsWith("/_next") ||
          pathname.startsWith("/favicon")
        ) {
          return true;
        }

        // Require authentication for chat routes
        if (pathname.startsWith("/chat")) {
          return !!token;
        }

        // Require authentication for protected API routes
        if (
          pathname.startsWith("/api/chat") ||
          pathname.startsWith("/api/chats")
        ) {
          return !!token;
        }

        // Allow all other routes by default
        return true;
      },
    },
  },
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
