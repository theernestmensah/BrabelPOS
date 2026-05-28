"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Settings,
  ShoppingBag,
  Wifi,
  WifiOff,
  Menu,
  X,
  Crown,
  BriefcaseBusiness,
  BarChart3,
  ClipboardList,
  CreditCard,
  Mail,
  Network,
  ReceiptText,
  Truck,
  Users,
} from "lucide-react";
import { useState, useEffect } from "react";
import { SafeUserButton as UserButton, useAuthUser as useUser } from "@/lib/clerk-safe";

const navItems = [
  { href: "/portal", icon: LayoutDashboard, label: "Pulse Overview" },
  { href: "/pos", icon: ShoppingCart, label: "Terminal (POS)" },
  { href: "/portal/inventory", icon: Package, label: "Inventory" },
  { href: "/portal/reports", icon: BarChart3, label: "Reports" },
  { href: "/portal/staff", icon: Users, label: "Staff" },
  { href: "/portal/operations", icon: BriefcaseBusiness, label: "Operations" },
  { href: "/portal/customers", icon: Users, label: "Customers" },
  { href: "/portal/suppliers", icon: Truck, label: "Suppliers" },
  { href: "/portal/expenses", icon: ReceiptText, label: "Expenses" },
  { href: "/portal/messages", icon: Mail, label: "Messages" },
  { href: "/portal/subscription", icon: CreditCard, label: "Subscription" },
  { href: "/portal/audit-logs", icon: ClipboardList, label: "Audit Logs" },
  { href: "/portal/branches", icon: Network, label: "Branches" },
  { href: "/portal/settings", icon: Settings, label: "Settings" },
];

function OnlineIndicator() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const update = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    update();
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-smooth ${
        isOnline
          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
          : "bg-orange-500/10 text-orange-400 border border-orange-500/20"
      }`}
    >
      {isOnline ? (
        <Wifi className="w-3 h-3" />
      ) : (
        <WifiOff className="w-3 h-3" />
      )}
      {isOnline ? "Online" : "Offline"}
    </div>
  );
}

function UserProfileCard() {
  const { user, isLoaded } = useUser();

  const displayName = user?.fullName ?? user?.username ?? "User";
  const email = user?.emailAddresses[0]?.emailAddress ?? "";

  return (
    <div className="mt-4 flex items-center gap-3 p-3 rounded-xl glass">
      <div className="relative">
        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-8 h-8 rounded-lg",
              userButtonTrigger: "focus:shadow-none",
            },
          }}
        />
      </div>
      <div className="flex-1 min-w-0">
        {isLoaded ? (
          <>
            <div className="text-xs font-semibold text-white/80 truncate">
              {displayName}
            </div>
            <div className="text-[10px] text-white/30 truncate">{email}</div>
          </>
        ) : (
          <>
            <div className="h-2.5 w-20 rounded-full bg-white/10 animate-pulse mb-1" />
            <div className="h-2 w-28 rounded-full bg-white/5 animate-pulse" />
          </>
        )}
      </div>
      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-metallic-gold/10 border border-metallic-gold/20">
        <Crown className="w-2.5 h-2.5 text-metallic-gold" />
        <span className="text-[9px] font-bold text-metallic-gold tracking-wide">PRO</span>
      </div>
    </div>
  );
}

function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : "-100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed left-0 top-0 bottom-0 w-64 z-40 lg:translate-x-0 lg:relative lg:block"
      >
        <div className="h-full flex flex-col glass border-r border-white/5 py-6">
          {/* Logo */}
          <div className="px-5 mb-8 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-cyan-dim flex items-center justify-center glow-cyan">
                <ShoppingBag className="w-5 h-5 text-obsidian" />
              </div>
              <div>
                <div className="font-black text-base leading-tight">
                  <span className="gradient-text-cyan">BrAbel</span>
                  <span className="text-white/70">POS</span>
                </div>
                <div className="text-[10px] text-white/30 tracking-widest">GHANA · GHS</div>
              </div>
            </Link>
            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded-lg glass text-white/40 hover:text-white transition-smooth"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Nav items */}
          <nav className="flex-1 px-3 space-y-1">
            {navItems.map(({ href, icon: Icon, label }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-smooth group ${
                    isActive
                      ? "bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/15"
                      : "text-white/50 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      isActive
                        ? "text-neon-cyan"
                        : "group-hover:text-white/80"
                    }`}
                  />
                  <span className="text-sm font-medium">{label}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-neon-cyan" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom section */}
          <div className="px-5 pt-5 border-t border-white/5">
            <OnlineIndicator />
            <UserProfileCard />
          </div>
        </div>
      </motion.aside>
    </>
  );
}

function Header({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="glass border-b border-white/5 px-4 py-3 lg:px-6 flex items-center justify-between">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg glass text-white/50 hover:text-white transition-smooth"
      >
        <Menu className="w-5 h-5" />
      </button>
      <div className="hidden lg:flex items-center gap-2 text-sm text-white/40">
        <span>BrAbel Merchant Portal</span>
        <span>·</span>
        <span className="text-neon-cyan">Empire Plan</span>
      </div>
      <div className="flex items-center gap-3">
        <OnlineIndicator />
        <Link
          href="/pos"
          className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-lg shimmer-btn text-obsidian text-sm font-bold hover:scale-105 transition-smooth"
        >
          <ShoppingCart className="w-4 h-4" />
          Open Terminal
        </Link>
        <div className="lg:hidden">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-8 h-8",
                userButtonTrigger: "focus:shadow-none",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-obsidian overflow-hidden">
      {/* Desktop sidebar — always visible */}
      <div className="hidden lg:block w-64 shrink-0">
        <Sidebar isOpen={true} onClose={() => {}} />
      </div>

      {/* Mobile sidebar */}
      <div className="lg:hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
