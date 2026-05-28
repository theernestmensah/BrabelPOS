"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  SafeSignInButton as SignInButton,
  SafeSignUpButton as SignUpButton,
  SafeUserButton as UserButton,
  useAuthUser as useUser,
} from "@/lib/clerk-safe";
import {
  ShoppingCart,
  Zap,
  Globe,
  BarChart3,
  Shield,
  Wifi,
  WifiOff,
  Star,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

const fadeUp: any = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

const stagger = {
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

function NavBar() {
  const { isSignedIn, isLoaded } = useUser();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 glass border-b border-white/5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-cyan-dim flex items-center justify-center glow-cyan">
          <ShoppingCart className="w-4 h-4 text-obsidian" />
        </div>
        <span className="font-bold text-lg tracking-tight">
          <span className="gradient-text-cyan">BrAbel</span>
          <span className="text-white/70">POS</span>
        </span>
      </div>

      <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
        <Link href="#features" className="hover:text-white transition-smooth">Features</Link>
        <Link href="/pricing" className="hover:text-white transition-smooth">Pricing</Link>
        <Link href="#why" className="hover:text-white transition-smooth">Why BrAbel</Link>
      </div>

      <div className="flex items-center gap-3">
        {isLoaded && isSignedIn && (
          <>
            <Link
              href="/portal"
              className="hidden md:inline-flex text-sm font-semibold text-white/80 hover:text-white transition-smooth px-4 py-2"
            >
              Dashboard
            </Link>
            <div className="ml-2 flex items-center justify-center">
              <UserButton appearance={{ elements: { avatarBox: "w-9 h-9" } }} />
            </div>
          </>
        )}

        {isLoaded && !isSignedIn && (
          <>
            <SignInButton mode="modal">
              <button className="hidden md:inline-flex text-sm text-white/70 hover:text-white transition-smooth px-4 py-2">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg shimmer-btn text-obsidian transition-smooth hover:scale-105">
                Start 7-Day Free Trial <ArrowRight className="w-4 h-4" />
              </button>
            </SignUpButton>
          </>
        )}
      </div>
    </nav>
  );
}

function HeroSection() {
  const { isSignedIn, isLoaded } = useUser();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-neon-cyan/5 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-metallic-gold/5 blur-3xl pointer-events-none" />

      <div className="relative z-10 container max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left: Copy */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-6"
        >
          <motion.div variants={fadeUp} custom={0}>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-cyan text-neon-cyan text-xs font-semibold tracking-widest uppercase">
              <Zap className="w-3 h-3" />
              Offline-First · Ghana-Ready · Enterprise-Grade
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            custom={1}
            className="text-5xl lg:text-7xl font-black leading-[1.05] tracking-tight"
          >
            The POS that{" "}
            <span className="gradient-text-cyan glow-text-cyan">
              never sleeps
            </span>
            <br />
            <span className="gradient-text-gold">even offline.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="text-lg text-white/60 max-w-lg leading-relaxed"
          >
            BrAbelPOS is the ultra-premium, offline-first point of sale and
            SaaS ecosystem purpose-built for African luxury retailers. Sell
            confidently — with or without internet.
          </motion.p>

          <motion.div
            variants={fadeUp}
            custom={3}
            className="flex flex-wrap gap-4"
          >
            {isLoaded && isSignedIn && (
              <Link
                href="/portal"
                className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-obsidian shimmer-btn transition-smooth hover:scale-105 hover:shadow-2xl"
              >
                Launch Terminal
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
            {isLoaded && !isSignedIn && (
              <SignUpButton mode="modal">
                <button className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-obsidian shimmer-btn transition-smooth hover:scale-105 hover:shadow-2xl">
                  Start 7-Day Free Trial
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </SignUpButton>
            )}
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold glass border border-white/10 text-white/80 hover:border-neon-cyan/30 hover:text-white transition-smooth"
            >
              View Pricing
            </Link>
          </motion.div>

          <motion.div
            variants={fadeUp}
            custom={4}
            className="flex items-center gap-6 pt-2"
          >
            {[
              { icon: CheckCircle2, text: "No credit card required" },
              { icon: CheckCircle2, text: "7-Day Free Trial" },
              { icon: CheckCircle2, text: "Set up in 2 minutes" },
            ].map(({ icon: Icon, text }) => (
              <span
                key={text}
                className="flex items-center gap-1.5 text-sm text-white/50"
              >
                <Icon className="w-4 h-4 text-neon-cyan" />
                {text}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* Right: Dashboard Mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <DashboardMockup />
        </motion.div>
      </div>
    </section>
  );
}

function DashboardMockup() {
  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Outer glow */}
      <div className="absolute -inset-4 bg-neon-cyan/10 rounded-3xl blur-2xl" />

      {/* Main card */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        className="relative glass-cyan rounded-2xl p-5 border border-neon-cyan/20 glow-cyan"
      >
        {/* Header bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
            <span className="text-xs font-semibold text-neon-cyan tracking-wider uppercase">BrAbel Pulse</span>
          </div>
          <div className="flex items-center gap-2 px-2 py-1 rounded-full glass text-xs text-green-400 border border-green-500/20">
            <Wifi className="w-3 h-3" />
            Online
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: "Today's Rev.", value: "₵ 12,400", icon: TrendingUp, color: "text-neon-cyan" },
            { label: "Transactions", value: "47", icon: ShoppingCart, color: "text-metallic-gold" },
            { label: "Pending Sync", value: "3", icon: WifiOff, color: "text-orange-400" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="glass rounded-xl p-3">
              <Icon className={`w-4 h-4 ${color} mb-1`} />
              <div className={`text-sm font-bold ${color}`}>{value}</div>
              <div className="text-[10px] text-white/40 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Mini chart */}
        <div className="glass rounded-xl p-3 mb-3">
          <div className="text-xs text-white/40 mb-2">Revenue This Week</div>
          <div className="flex items-end gap-1 h-12">
            {[30, 55, 40, 70, 85, 60, 95].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm"
                style={{
                  height: `${h}%`,
                  background: i === 6
                    ? "linear-gradient(to top, #00F0FF, #00F0FF80)"
                    : "rgba(0,240,255,0.2)",
                }}
              />
            ))}
          </div>
        </div>

        {/* Recent sale items */}
        <div className="space-y-2">
          {[
            { item: "Cartier Gold Frames", amount: "₵ 2,400", time: "2 min ago" },
            { item: "Creed Aventus 100ml", amount: "₵ 980", time: "14 min ago" },
          ].map(({ item, amount, time }) => (
            <div key={item} className="flex items-center justify-between glass rounded-lg px-3 py-2">
              <div>
                <div className="text-xs font-medium text-white/80">{item}</div>
                <div className="text-[10px] text-white/40">{time}</div>
              </div>
              <div className="text-xs font-bold text-metallic-gold">{amount}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Floating badge */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8 }}
        className="absolute -right-4 top-16 glass-gold rounded-xl px-3 py-2 border border-metallic-gold/30 glow-gold"
      >
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 fill-metallic-gold text-metallic-gold" />
          <div>
            <div className="text-xs font-bold text-metallic-gold">Empire Plan</div>
            <div className="text-[10px] text-white/50">AI Insights Active</div>
          </div>
        </div>
      </motion.div>

      {/* Floating offline badge */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1 }}
        className="absolute -left-4 bottom-20 glass rounded-xl px-3 py-2 border border-white/10"
      >
        <div className="flex items-center gap-2">
          <WifiOff className="w-4 h-4 text-orange-400" />
          <div>
            <div className="text-xs font-bold text-white/80">Offline Mode</div>
            <div className="text-[10px] text-white/50">3 sales queued</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: WifiOff,
      title: "Offline-First Engine",
      desc: "Sell confidently during power outages and network drops. Every transaction is saved locally via IndexedDB and synced when connectivity returns.",
      accent: "cyan",
    },
    {
      icon: Globe,
      title: "Multi-Branch Sync",
      desc: "Manage multiple retail locations from a single command center. Real-time inventory sync across Accra, Kumasi, Takoradi — and beyond.",
      accent: "gold",
    },
    {
      icon: BarChart3,
      title: "Cinematic Analytics",
      desc: "3D sales charts, AI-driven revenue forecasts, and staff performance leaderboards built for fast, data-driven decisions.",
      accent: "cyan",
    },
    {
      icon: Shield,
      title: "Bank-Grade Security",
      desc: "End-to-end encryption, role-based access control, and immutable audit logs keep your business data protected at every layer.",
      accent: "gold",
    },
    {
      icon: Zap,
      title: "2-Second Checkout",
      desc: "Scan. Confirm. Done. The streamlined POS terminal is optimised for speed — process up to 120 transactions per hour.",
      accent: "cyan",
    },
    {
      icon: TrendingUp,
      title: "Ghana Cedi Native",
      desc: "Built for GHS by default. MoMo payments, VAT-compliant receipts, and Ghana Revenue Authority reporting out of the box.",
      accent: "gold",
    },
  ];

  return (
    <section id="features" className="py-28 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-32 bg-gradient-to-b from-transparent to-neon-cyan/30" />

      <div className="container max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-neon-cyan text-sm font-semibold tracking-widest uppercase">Features</span>
          <h2 className="text-4xl lg:text-5xl font-black mt-3 mb-4">
            Built for the{" "}
            <span className="gradient-text-gold">African hustle.</span>
          </h2>
          <p className="text-white/50 max-w-xl mx-auto">
            Every feature was designed with Ghana&apos;s unique market realities in
            mind — from unreliable power to MoMo-first customers.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, title, desc, accent }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -4, scale: 1.01 }}
              className={`group relative rounded-2xl p-6 transition-smooth cursor-default ${
                accent === "cyan" ? "glass-cyan" : "glass-gold"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                  accent === "cyan"
                    ? "bg-neon-cyan/10 text-neon-cyan"
                    : "bg-metallic-gold/10 text-metallic-gold"
                }`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">{title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
              <div
                className={`absolute bottom-0 left-6 right-6 h-px ${
                  accent === "cyan"
                    ? "bg-gradient-to-r from-neon-cyan/40 to-transparent"
                    : "bg-gradient-to-r from-metallic-gold/40 to-transparent"
                }`}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  const { isSignedIn, isLoaded } = useUser();

  return (
    <section className="py-28 relative">
      <div className="absolute inset-0 bg-radial-gradient" />
      <div className="container max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative glass-gold rounded-3xl p-12 border border-metallic-gold/25 glow-gold overflow-hidden"
        >
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-metallic-gold/10 rounded-full blur-3xl pointer-events-none" />
          <span className="relative text-metallic-gold text-sm font-semibold tracking-widest uppercase">Ready to scale?</span>
          <h2 className="relative text-4xl lg:text-5xl font-black mt-4 mb-4">
            Start free,{" "}
            <span className="gradient-text-gold">grow forever.</span>
          </h2>
          <p className="relative text-white/50 mb-8 max-w-lg mx-auto">
            Set up your first terminal in under 2 minutes. No credit card
            needed. Upgrade when you&apos;re ready to unlock the Empire.
          </p>
          <div className="relative flex flex-wrap justify-center gap-4">
            {isLoaded && isSignedIn && (
              <Link
                href="/portal"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-obsidian shimmer-btn hover:scale-105 transition-smooth"
              >
                Launch Your Terminal <ArrowRight className="w-5 h-5" />
              </Link>
            )}
            {isLoaded && !isSignedIn && (
              <SignUpButton mode="modal">
                <button className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-obsidian shimmer-btn hover:scale-105 transition-smooth">
                  Start 7-Day Free Trial <ArrowRight className="w-5 h-5" />
                </button>
              </SignUpButton>
            )}
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold glass border border-white/10 text-white/80 hover:border-metallic-gold/30 hover:text-white transition-smooth"
            >
              Explore Plans
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/5 py-10">
      <div className="container max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-neon-cyan" />
          <span className="font-bold">
            <span className="gradient-text-cyan">BrAbel</span>
            <span className="text-white/50">POS</span>
          </span>
        </div>
        <p className="text-sm text-white/30">
          © {new Date().getFullYear()} BrAbel Technologies. Built for Africa. 🇬🇭
        </p>
        <div className="flex gap-5 text-sm text-white/40">
          <Link href="/pricing" className="hover:text-white transition-smooth">Pricing</Link>
          <Link href="/portal" className="hover:text-white transition-smooth">Dashboard</Link>
          <Link href="/pos" className="hover:text-white transition-smooth">Terminal</Link>
        </div>
      </div>
    </footer>
  );
}

export default function MarketingPage() {
  return (
    <main className="bg-obsidian min-h-screen">
      <NavBar />
      <HeroSection />
      <FeaturesSection />
      <CTASection />
      <Footer />
    </main>
  );
}
