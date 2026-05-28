"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  SafeSignUpButton as SignUpButton,
  useAuthUser as useUser,
} from "@/lib/clerk-safe";

declare global {
  interface Window {
    PaystackPop?: {
      setup: (config: {
        key: string;
        email: string;
        amount: number;
        currency: string;
        ref: string;
        callback: (response: { reference: string }) => void;
        onClose: () => void;
      }) => {
        openIframe: () => void;
      };
    };
  }
}

function loadPaystackScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.PaystackPop) {
      resolve();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://js.paystack.co/v1/inline.js"]'
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Paystack failed to load.")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Paystack failed to load."));
    document.head.appendChild(script);
  });
}

export default function CheckoutAction({ 
  amount, 
  cta, 
  activeClass 
}: { 
  amount: number; 
  cta: string; 
  activeClass: string; 
}) {
  const { user, isSignedIn } = useUser();
  const email = user?.emailAddresses[0]?.emailAddress || "guest@brabelpos.com";
  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "";

  const startPayment = async () => {
    if (!publicKey || publicKey.includes("REPLACE_ME") || publicKey.includes("placeholder")) {
      window.location.href = "/portal/subscription";
      return;
    }

    await loadPaystackScript();
    window.PaystackPop?.setup({
      key: publicKey,
      email,
      amount: amount * 100,
      currency: "GHS",
      ref: `brabel_${Date.now()}`,
      callback: async (response) => {
        await fetch("/api/payments/verify", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ reference: response.reference }),
        }).catch(() => null);
        window.location.href = "/portal/subscription";
      },
      onClose: () => {},
    }).openIframe();
  };

  if (amount === 0) {
    return (
      <>
        {!isSignedIn && (
          <SignUpButton mode="modal">
            <button className={activeClass}>
              Start For Free <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </SignUpButton>
        )}
        {isSignedIn && (
          <Link href="/portal" className={activeClass}>
            Go To Portal <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}
      </>
    );
  }

  return (
    <>
      {!isSignedIn && (
        <SignUpButton mode="modal">
          <button className={activeClass}>
            Start 7-Day Free Trial <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </SignUpButton>
      )}
      {isSignedIn && (
        <button 
          onClick={startPayment}
          className={activeClass}
        >
          {cta} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      )}
    </>
  );
}
