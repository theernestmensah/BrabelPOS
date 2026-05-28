"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  X,
  Zap,
  Star,
  Crown,
  ArrowRight,
  ShoppingCart,
} from "lucide-react";
import {
  SafeSignInButton as SignInButton,
  SafeSignUpButton as SignUpButton,
  SafeUserButton as UserButton,
  useAuthUser as useUser,
} from "@/lib/clerk-safe";
import dynamic from "next/dynamic";

const CheckoutAction = dynamic(() => import("./CheckoutAction"), { ssr: false });

const tiers = [
  {
    id: "solo",
    name: "BrAbel Solo",
    tagline: "For testing the waters",
    price: 0,
    priceLabel: "Free forever",
    icon: Zap,
    accent: "cyan",
    features: [
      { text: "Single terminal POS", included: true },
      { text: "Local IndexedDB storage (offline-first)", included: true },
      { text: "Up to 20 products/items", included: true },
      { text: "Basic receipt printing", included: true },
      { text: "Ghana Cedi & MoMo support", included: true },
      { text: "No staff access control", included: false },
      { text: "Cloud sync", included: false },
      { text: "Inventory alerts", included: false },
      { text: "Multi-branch support", included: false },
      { text: "AI Pulse analytics", included: false },
    ],
    cta: "Try Solo",
    ctaHref: "/portal",
  },
  {
    id: "growth",
    name: "BrAbel Growth",
    tagline: "The real shop plan",
    price: 29,
    priceLabel: "$29 / month",
    icon: Star,
    accent: "cyan",
    highlighted: true,
    features: [
      { text: "Everything in Solo", included: true },
      { text: "Cloud sync & backup", included: true },
      { text: "Up to 300 products/items", included: true },
      { text: "Low stock & reorder alerts", included: true },
      { text: "Basic reporting dashboard", included: true },
      { text: "3-level staff access control", included: true },
      { text: "Cash drawer shift controls", included: true },
      { text: "Staff leaderboard", included: true },
      { text: "Multi-branch sync", included: false },
      { text: "AI Pulse & 3D analytics", included: false },
    ],
    cta: "Start 14-Day Trial",
    ctaHref: "/portal",
  },
  {
    id: "empire",
    name: "BrAbel Empire",
    tagline: "Dominate your market",
    price: 99,
    priceLabel: "$99 / month",
    icon: Crown,
    accent: "gold",
    features: [
      { text: "Everything in Growth", included: true },
      { text: "Unlimited products & staff", included: true },
      { text: "Multi-branch real-time sync", included: true },
      { text: "Cinematic 3D analytics", included: true },
      { text: "AI Pulse revenue forecasting", included: true },
      { text: "Custom branding & receipts", included: true },
      { text: "Priority 24/7 support", included: true },
      { text: "Ghana Revenue Authority exports", included: true },
      { text: "Dedicated account manager", included: true },
    ],
    cta: "Launch Empire",
    ctaHref: "/portal",
  },
];

export default function PricingPage() {
  const { isSignedIn, isLoaded } = useUser();

  return (
    <main className="bg-obsidian min-h-screen pt-20">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 glass border-b border-white/5">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-cyan-dim flex items-center justify-center glow-cyan">
            <ShoppingCart className="w-4 h-4 text-obsidian" />
          </div>
          <span className="font-bold text-lg tracking-tight">
            <span className="gradient-text-cyan">BrAbel</span>
            <span className="text-white/70">POS</span>
          </span>
        </Link>
        <div className="flex gap-4 text-sm font-semibold items-center">
          <Link href="/" className="hidden md:block hover:text-white text-white/50 transition-smooth">Home</Link>
          {isLoaded && isSignedIn && (
            <>
              <Link href="/portal" className="hidden md:block hover:text-white text-white/80 transition-smooth">Dashboard</Link>
              <UserButton appearance={{ elements: { avatarBox: "w-8 h-8 ml-2" } }} />
            </>
          )}
          {isLoaded && !isSignedIn && (
            <>
              <SignInButton mode="modal">
                <button className="text-white/60 hover:text-white transition-smooth">Sign In</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-md text-white transition-smooth">
                  Get Started
                </button>
              </SignUpButton>
            </>
          )}
        </div>
      </nav>

      <div className="relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-metallic-gold/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative container max-w-7xl mx-auto px-6 py-20">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-gold text-metallic-gold text-xs font-semibold tracking-widest uppercase mb-4">
              <Crown className="w-3 h-3" />
              Simple, transparent pricing
            </span>
            <h1 className="text-5xl lg:text-7xl font-black mt-4 mb-4">
              Choose your{" "}
              <span className="gradient-text-gold">empire.</span>
            </h1>
            <p className="text-white/50 max-w-xl mx-auto text-lg">
              Start free. Scale as you grow. No hidden fees, no surprises — just
              clean pricing built for the African entrepreneur.
            </p>
          </motion.div>

          {/* Pricing cards */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {tiers.map(
              (
                {
                  id,
                  name,
                  tagline,
                  price,
                  priceLabel,
                  icon: Icon,
                  accent,
                  highlighted,
                  features,
                  cta,
                  ctaHref,
                },
                i
              ) => (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15 }}
                  whileHover={{ y: highlighted ? -8 : -4, scale: 1.01 }}
                  className={`relative rounded-2xl p-6 flex flex-col gap-5 transition-smooth ${
                    highlighted
                      ? "glass-gold glow-gold border border-metallic-gold/30 animate-gold-pulse"
                      : "glass border border-white/8"
                  }`}
                >
                  {highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-metallic-gold text-obsidian text-xs font-black tracking-wider uppercase">
                      Most Popular
                    </div>
                  )}

                  {/* Tier header */}
                  <div>
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                        accent === "gold"
                          ? "bg-metallic-gold/15 text-metallic-gold"
                          : "bg-neon-cyan/15 text-neon-cyan"
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <h2 className="font-black text-xl">{name}</h2>
                    <p className="text-white/50 text-sm mt-1">{tagline}</p>
                  </div>

                  {/* Price */}
                  <div>
                    <div
                      className={`text-3xl font-black ${
                        accent === "gold"
                          ? "gradient-text-gold"
                          : "gradient-text-cyan"
                      }`}
                    >
                      {priceLabel}
                    </div>
                    {id !== "solo" && (
                      <p className="text-white/30 text-xs mt-1">
                        Billed monthly · Cancel anytime
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="flex flex-col gap-2.5 flex-1">
                    {features.map(({ text, included }) => (
                      <li
                        key={text}
                        className={`flex items-start gap-2.5 text-sm ${
                          included ? "text-white/80" : "text-white/25 line-through"
                        }`}
                      >
                        {included ? (
                          <CheckCircle2
                            className={`w-4 h-4 shrink-0 mt-0.5 ${
                              accent === "gold"
                                ? "text-metallic-gold"
                                : "text-neon-cyan"
                            }`}
                          />
                        ) : (
                          <X className="w-4 h-4 shrink-0 mt-0.5 text-white/20" />
                        )}
                        {text}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <CheckoutAction 
                    amount={price} 
                    cta={cta} 
                    activeClass={`group flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-bold text-sm transition-smooth hover:scale-[1.02] ${
                      highlighted
                        ? "shimmer-btn text-obsidian"
                        : "glass border border-white/10 text-white/80 hover:border-neon-cyan/30 hover:text-white"
                    }`}
                  />
                </motion.div>
              )
            )}
          </div>

          {/* Enterprise note */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center text-white/30 text-sm mt-12"
          >
            Need custom pricing for 10+ branches or enterprise integration?{" "}
            <Link
              href="/portal"
              className="text-neon-cyan hover:text-white transition-smooth underline underline-offset-2"
            >
              Contact our team
            </Link>
          </motion.p>
        </div>
      </div>
    </main>
  );
}
