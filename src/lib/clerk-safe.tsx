"use client";

/**
 * Safe Clerk auth wrappers.
 * When Clerk is not configured (placeholder keys), these components
 * render as if the user is a signed-out guest — no crashes.
 */

import { clerkEnabled } from "@/lib/auth";
import Link from "next/link";

// ── Lazy Clerk imports (only executed when Clerk is enabled) ─────────────
let _useUser: () => { isSignedIn: boolean | null | undefined; isLoaded: boolean; user: any } =
  () => ({ isSignedIn: false, isLoaded: true, user: null });

let _SignInButton: React.FC<{ children: React.ReactNode; mode?: string }> = ({ children }) => (
  <>{children}</>
);

let _SignUpButton: React.FC<{ children: React.ReactNode; mode?: string }> = ({ children }) => (
  <>{children}</>
);

let _UserButton: React.FC<{ appearance?: any }> = () => null;
let _ClerkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>{children}</>
);

if (clerkEnabled && typeof window !== "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const clerk = require("@clerk/nextjs");
  _useUser = clerk.useUser;
  _SignInButton = clerk.SignInButton;
  _SignUpButton = clerk.SignUpButton;
  _UserButton = clerk.UserButton;
  _ClerkProvider = clerk.ClerkProvider;
}

export function useAuthUser() {
  if (typeof window === "undefined" || !clerkEnabled) {
    return { isSignedIn: false, isLoaded: true, user: null };
  }

  return _useUser();
}

export const SafeSignInButton: React.FC<{ children: React.ReactNode; mode?: string }> = (props) => {
  if (typeof window === "undefined" || !clerkEnabled) return <>{props.children}</>;
  return <_SignInButton {...props} />;
};

export const SafeSignUpButton: React.FC<{ children: React.ReactNode; mode?: string }> = (props) => {
  if (typeof window === "undefined" || !clerkEnabled) return <>{props.children}</>;
  return <_SignUpButton {...props} />;
};

export const SafeUserButton: React.FC<{ appearance?: any }> = (props) => {
  if (typeof window === "undefined" || !clerkEnabled) return null;
  return <_UserButton {...props} />;
};

export const SafeClerkProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  if (typeof window === "undefined" || !clerkEnabled) return <>{children}</>;
  return <_ClerkProvider>{children}</_ClerkProvider>;
};
