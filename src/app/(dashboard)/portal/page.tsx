"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  WifiOff,
  Star,
  Trophy,
  ShoppingCart,
  BarChart3,
  Users,
  Package,
  ArrowUpRight,
  Zap,
  AlertTriangle,
  HandCoins,
} from "lucide-react";
import Link from "next/link";
import {
  db,
  seedDatabaseIfEmpty,
  getTodayRevenue,
  getPendingSyncCount,
  getTopSellingItem,
  type StaffMember,
} from "@/lib/db";
import { formatCurrency } from "@/lib/utils";

const fadeUp: any = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  index,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  accent: "cyan" | "gold" | "orange";
  index: number;
}) {
  const iconColors = {
    cyan: "bg-neon-cyan/10 text-neon-cyan",
    gold: "bg-metallic-gold/10 text-metallic-gold",
    orange: "bg-orange-500/10 text-orange-400",
  };
  const valueColors = {
    cyan: "text-neon-cyan",
    gold: "text-metallic-gold",
    orange: "text-orange-400",
  };

  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -3, scale: 1.01 }}
      className="relative glass rounded-2xl p-5 border border-white/6 transition-smooth overflow-hidden group"
    >
      <div
        className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-smooth"
        style={{
          background:
            accent === "cyan"
              ? "linear-gradient(90deg, #00F0FF, transparent)"
              : accent === "gold"
              ? "linear-gradient(90deg, #D4AF37, transparent)"
              : "linear-gradient(90deg, #f97316, transparent)",
        }}
      />
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColors[accent]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <ArrowUpRight className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-smooth" />
      </div>
      <div className={`text-2xl font-black ${valueColors[accent]}`}>{value}</div>
      <div className="text-sm text-white/50 mt-1">{label}</div>
      {sub && <div className="text-xs text-white/30 mt-1">{sub}</div>}
    </motion.div>
  );
}

function StaffLeaderboard({ staff }: { staff: StaffMember[] }) {
  const medals = ["🥇", "🥈", "🥉"];
  const maxRevenue = Math.max(...staff.map((s) => s.totalRevenue), 1);

  return (
    <motion.div
      variants={fadeUp}
      custom={4}
      initial="hidden"
      animate="visible"
      className="glass rounded-2xl p-5 border border-white/6"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-metallic-gold" />
          <h2 className="font-bold text-base">Staff Leaderboard</h2>
        </div>
        <span className="text-xs text-white/30 px-2 py-1 glass rounded-full">Today</span>
      </div>

      <div className="space-y-3">
        {staff.map((member, i) => {
          const progress = (member.totalRevenue / maxRevenue) * 100;
          return (
            <motion.div
              key={member.staffId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="flex items-center gap-4"
            >
              <span className="text-xl w-8 text-center shrink-0">
                {medals[i] ?? "⭐"}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-white/90 truncate">{member.name}</span>
                  <span className="text-xs font-bold text-metallic-gold ml-2 shrink-0">
                    {formatCurrency(member.totalRevenue)}
                  </span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ delay: 0.6 + i * 0.1, duration: 0.8, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{
                      background:
                        i === 0
                          ? "linear-gradient(90deg, #D4AF37, #f0d060)"
                          : i === 1
                          ? "linear-gradient(90deg, #C0C0C0, #e0e0e0)"
                          : "linear-gradient(90deg, #CD7F32, #e09a52)",
                    }}
                  />
                </div>
                <div className="text-[10px] text-white/30 mt-0.5">
                  {member.totalSales} sales · {member.role}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

function RecentActivity() {
  return (
    <motion.div
      variants={fadeUp}
      custom={5}
      initial="hidden"
      animate="visible"
      className="glass rounded-2xl p-5 border border-white/6"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-neon-cyan" />
          <h2 className="font-bold text-base">Revenue This Week</h2>
        </div>
        <span className="text-xs text-neon-cyan px-2 py-1 glass-cyan rounded-full border border-neon-cyan/15">Live</span>
      </div>

      <div className="flex items-end justify-between gap-1 h-24 mb-4">
        {[
          { day: "Mon", h: 40 },
          { day: "Tue", h: 65 },
          { day: "Wed", h: 45 },
          { day: "Thu", h: 80 },
          { day: "Fri", h: 55 },
          { day: "Sat", h: 90 },
          { day: "Sun", h: 70 },
        ].map(({ day, h }, i) => (
          <div key={day} className="flex flex-col items-center gap-1 flex-1">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ delay: 0.3 + i * 0.08, duration: 0.6, ease: "easeOut" }}
              className="w-full rounded-t-sm"
              style={{
                background:
                  i === 5
                    ? "linear-gradient(to top, #00F0FF, #00F0FF60)"
                    : "rgba(0,240,255,0.15)",
                minHeight: "4px",
              }}
            />
            <span className="text-[10px] text-white/30">{day}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-white/40">Peak day: Saturday</span>
        <span className="text-neon-cyan font-semibold">+18% vs last week</span>
      </div>
    </motion.div>
  );
}

function QuickActions() {
  const actions = [
    { icon: ShoppingCart, label: "New Sale", href: "/pos", accent: "shimmer-btn text-obsidian" },
    { icon: Package, label: "Inventory", href: "/portal/inventory", accent: "glass border border-white/10 text-white/70 hover:border-neon-cyan/20" },
    { icon: Users, label: "Operations", href: "/portal/operations", accent: "glass border border-white/10 text-white/70 hover:border-neon-cyan/20" },
    { icon: BarChart3, label: "Reports", href: "/portal", accent: "glass border border-white/10 text-white/70 hover:border-neon-cyan/20" },
  ];

  return (
    <motion.div
      variants={fadeUp}
      custom={3}
      initial="hidden"
      animate="visible"
      className="glass rounded-2xl p-5 border border-white/6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-metallic-gold" />
        <h2 className="font-bold text-base">Quick Actions</h2>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {actions.map(({ icon: Icon, label, href, accent }) => (
          <Link
            key={label}
            href={href}
            className={`flex flex-col items-center gap-2 py-4 rounded-xl text-sm font-semibold transition-smooth hover:scale-[1.02] text-center ${accent}`}
          >
            <Icon className="w-5 h-5" />
            {label}
          </Link>
        ))}
      </div>
    </motion.div>
  );
}

export default function PortalPage() {
  const [metrics, setMetrics] = useState({
    revenue: 0,
    pendingSync: 0,
    topItem: "Loading...",
    expenses: 0,
    refunds: 0,
    variance: 0,
    margin: 0,
  });
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      await seedDatabaseIfEmpty();
      const [revenue, pendingSync, topItem, staffList, expenses, sales, shifts] = await Promise.all([
        getTodayRevenue(),
        getPendingSyncCount(),
        getTopSellingItem(),
        db.staff.orderBy("totalRevenue").reverse().toArray(),
        db.expenses.toArray(),
        db.sales.toArray(),
        db.cashShifts.toArray(),
      ]);
      const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const refunds = sales.filter((sale) => sale.refundedAt).length;
      const variance = shifts.reduce((sum, shift) => sum + (shift.variance ?? 0), 0);
      const margin = revenue * 0.42 - totalExpenses;
      setMetrics({
        revenue,
        pendingSync,
        topItem,
        expenses: totalExpenses,
        refunds,
        variance,
        margin,
      });
      setStaff(staffList);
      setIsLoading(false);
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-black">
            <span className="gradient-text-cyan">BrAbel</span> Pulse
          </h1>
          <p className="text-white/40 text-sm mt-0.5">
            {new Date().toLocaleDateString("en-GH", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-gold border border-metallic-gold/20 text-xs font-semibold text-metallic-gold">
          <Star className="w-3 h-3 fill-metallic-gold" />
          Empire Plan
        </div>
      </motion.div>

      {/* Metric cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <MetricCard
          icon={TrendingUp}
          label="Today&apos;s Revenue"
          value={isLoading ? "—" : formatCurrency(metrics.revenue)}
          sub="Updated in real-time"
          accent="cyan"
          index={0}
        />
        <MetricCard
          icon={WifiOff}
          label="Offline Sales Pending Sync"
          value={isLoading ? "—" : `${metrics.pendingSync}`}
          sub={metrics.pendingSync === 0 ? "All synced ✓" : "Will sync when online"}
          accent="orange"
          index={1}
        />
        <MetricCard
          icon={Star}
          label="Top Selling Item"
          value={isLoading ? "—" : ""}
          sub={isLoading ? "" : metrics.topItem}
          accent="gold"
          index={2}
        />
      </div>

      <div className="grid sm:grid-cols-4 gap-4">
        <MetricCard
          icon={HandCoins}
          label="Recorded Expenses"
          value={isLoading ? "â€”" : formatCurrency(metrics.expenses)}
          sub="Local expense ledger"
          accent="orange"
          index={3}
        />
        <MetricCard
          icon={TrendingUp}
          label="Estimated Margin"
          value={isLoading ? "â€”" : formatCurrency(metrics.margin)}
          sub="Revenue estimate minus expenses"
          accent="gold"
          index={4}
        />
        <MetricCard
          icon={AlertTriangle}
          label="Refunds"
          value={isLoading ? "â€”" : `${metrics.refunds}`}
          sub="Requires manager review"
          accent="orange"
          index={5}
        />
        <MetricCard
          icon={WifiOff}
          label="Cash Variance"
          value={isLoading ? "â€”" : formatCurrency(metrics.variance)}
          sub="Closed shift differences"
          accent="cyan"
          index={6}
        />
      </div>

      <motion.div
        variants={fadeUp}
        custom={7}
        initial="hidden"
        animate="visible"
        className="glass rounded-2xl p-5 border border-white/6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-5 h-5 text-metallic-gold" />
          <h2 className="font-bold text-base">AI Pulse Recommendations</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-3 text-sm">
          <div className="glass rounded-xl p-4 text-white/60">
            Reorder focus: <span className="text-white font-semibold">{metrics.topItem}</span>
          </div>
          <div className="glass rounded-xl p-4 text-white/60">
            Watch cash variance above {formatCurrency(50)} before approving shift closes.
          </div>
          <div className="glass rounded-xl p-4 text-white/60">
            Refund count: <span className="text-orange-400 font-semibold">{metrics.refunds}</span>. Review refunded receipts daily.
          </div>
        </div>
      </motion.div>

      {/* Lower grid */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <RecentActivity />
        </div>
        <div className="space-y-4">
          <QuickActions />
        </div>
      </div>

      {/* Staff leaderboard */}
      {staff.length > 0 && <StaffLeaderboard staff={staff} />}
    </div>
  );
}
