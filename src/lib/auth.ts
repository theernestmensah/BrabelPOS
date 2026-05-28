/**
 * Safe wrapper around Clerk's useUser.
 * Returns guest-mode defaults when Clerk is not configured
 * (i.e. NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is still a placeholder).
 */

const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
export const clerkEnabled =
  clerkKey.length > 0 &&
  !clerkKey.includes("REPLACE_ME") &&
  clerkKey.startsWith("pk_");
