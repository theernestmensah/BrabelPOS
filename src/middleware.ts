import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
const clerkEnabled =
  clerkKey.length > 0 &&
  !clerkKey.includes("REPLACE_ME") &&
  clerkKey.startsWith("pk_");

// These routes require authentication
const isProtectedRoute = createRouteMatcher([
  "/portal(.*)",
  "/pos(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // Skip auth entirely if Clerk is not configured
  if (!clerkEnabled) return NextResponse.next();

  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};

